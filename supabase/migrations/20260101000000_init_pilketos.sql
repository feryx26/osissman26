-- =====================================================================
-- E-Pilketos OSIS · Skema Supabase (Postgres), RLS, dan fungsi server
--
-- Cara pakai:
--   1. Buka Supabase Dashboard > SQL Editor, lalu tempel seluruh isi file ini.
--   2. Atau, bila memakai Supabase CLI: `supabase db push`.
-- File ini idempoten (aman dijalankan ulang).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- TABEL
-- ---------------------------------------------------------------
create table if not exists public.candidates (
  id                 bigint primary key,
  number             integer not null,
  chairman_name      text not null,
  vice_chairman_name text not null,
  photo_url          text not null default '',
  slogan             text not null default '',
  vision             text not null default '',
  mission            jsonb not null default '[]'::jsonb,
  work_programs      jsonb not null default '[]'::jsonb,
  votes              integer not null default 0,
  color              jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

create table if not exists public.students (
  nis              text primary key,
  nisn             text,
  name             text not null,
  grade            text not null,
  gender           text not null check (gender in ('L', 'P')),
  token            text not null,
  has_voted        boolean not null default false,
  voted_at         text,
  receipt_id       text,
  candidate_chosen bigint,
  created_at       timestamptz not null default now()
);

create table if not exists public.settings (
  id             integer primary key default 1,
  school_name    text not null default 'SMA NEGERI 26 GARUT',
  school_address text not null default '',
  logo_url       text not null default '',
  school_year    text not null default '',
  election_title text not null default '',
  is_open        boolean not null default true,
  total_voters   integer not null default 0,
  last_updated   timestamptz not null default now(),
  scheduled_end  text not null default '',
  constraint settings_singleton check (id = 1)
);

create table if not exists public.vote_logs (
  id               text primary key,
  timestamp        text not null default '',
  grade            text not null default '',
  masked_nis       text not null default '',
  candidate_number integer not null,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- HELPER: deteksi apakah pemanggil adalah panitia (role=admin)
-- ---------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ---------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------
alter table public.candidates enable row level security;
alter table public.students   enable row level security;
alter table public.settings   enable row level security;
alter table public.vote_logs  enable row level security;

-- candidates: semua orang boleh baca (real count publik), hanya panitia yang menulis
drop policy if exists candidates_public_read on public.candidates;
create policy candidates_public_read on public.candidates
  for select to anon, authenticated using (true);

drop policy if exists candidates_admin_write on public.candidates;
create policy candidates_admin_write on public.candidates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- settings: publik boleh baca, panitia boleh ubah
drop policy if exists settings_public_read on public.settings;
create policy settings_public_read on public.settings
  for select to anon, authenticated using (true);

drop policy if exists settings_admin_write on public.settings;
create policy settings_admin_write on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- vote_logs: publik boleh baca (sudah disamarkan), hanya panitia yang menulis
drop policy if exists logs_public_read on public.vote_logs;
create policy logs_public_read on public.vote_logs
  for select to anon, authenticated using (true);

drop policy if exists logs_admin_write on public.vote_logs;
create policy logs_admin_write on public.vote_logs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- students: panitia boleh akses penuh, siswa hanya barisnya sendiri.
-- Pembacaan publik dilakukan melalui view `students_public` (tanpa token).
drop policy if exists students_admin_all on public.students;
create policy students_admin_all on public.students
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists students_self_read on public.students;
create policy students_self_read on public.students
  for select to authenticated
  using (nis = (auth.jwt() -> 'app_metadata' ->> 'nis'));

-- ---------------------------------------------------------------
-- VIEW PUBLIK: DPT tanpa data sensitif (tanpa token & pilihan suara)
-- ---------------------------------------------------------------
drop view if exists public.students_public;
create view public.students_public as
  select nis, nisn, name, grade, gender, has_voted, voted_at
  from public.students;

-- ---------------------------------------------------------------
-- GRANTS
-- ---------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.candidates to anon, authenticated;
grant select on public.settings   to anon, authenticated;
grant select on public.vote_logs  to anon, authenticated;
grant select on public.students_public to anon, authenticated;

revoke all on public.students from anon, authenticated;
grant select, insert, update, delete on public.students to authenticated;

grant insert, update, delete on public.candidates to authenticated;
grant insert, update, delete on public.settings   to authenticated;
grant insert, update, delete on public.vote_logs  to authenticated;

-- ---------------------------------------------------------------
-- RPC: resolve_login_email(identifier) -> email login
-- identifier boleh berupa NIS (NO INDUK) maupun NISN.
-- ---------------------------------------------------------------
create or replace function public.resolve_login_email(p_identifier text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select s.nis || '@smus26garut.local'
  from public.students s
  where s.nis = btrim(p_identifier) or s.nisn = btrim(p_identifier)
  limit 1;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- ---------------------------------------------------------------
-- RPC: cast_vote(p_nis, p_candidate_id)
-- Siswa hanya boleh mencoblos untuk dirinya sendiri; panitia boleh
-- mencoblos atas nama pemilih (mode pendampingan / simulasi).
-- Satu transaksi atomik: incremnen suara, tandai pemilih, catat log.
-- ---------------------------------------------------------------
create or replace function public.cast_vote(p_nis text, p_candidate_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  v_is_admin    boolean := public.is_admin();
  v_caller_nis  text := auth.jwt() -> 'app_metadata' ->> 'nis';
  v_is_open     boolean;
  v_student     public.students%rowtype;
  v_candidate   public.candidates%rowtype;
  v_receipt     text;
  v_time_str    text;
  v_now         timestamptz := now();
begin
  if not v_is_admin and (v_caller_nis is null or v_caller_nis <> p_nis) then
    return jsonb_build_object('success', false,
      'message', 'Sesi tidak sah untuk memberikan suara atas nama pemilih ini.');
  end if;

  select is_open into v_is_open from public.settings where id = 1;
  if v_is_open is null then
    return jsonb_build_object('success', false,
      'message', 'Konfigurasi pemilihan belum tersedia di server.');
  end if;
  if not v_is_open then
    return jsonb_build_object('success', false,
      'message', 'Pemungutan suara saat ini sedang DITUTUP oleh Panitia KPU Sekolah.');
  end if;

  select * into v_student from public.students where nis = p_nis for update;
  if v_student.nis is null then
    return jsonb_build_object('success', false, 'message', 'Data siswa pemilih tidak valid.');
  end if;
  if v_student.has_voted then
    return jsonb_build_object('success', false,
      'message', 'Hak suara Anda sudah digunakan sebelumnya. Pemilihan hanya dapat dilakukan 1 (satu) kali.');
  end if;

  select * into v_candidate from public.candidates where id = p_candidate_id for update;
  if v_candidate.id is null then
    return jsonb_build_object('success', false, 'message', 'Pilihan pasangan calon tidak valid.');
  end if;

  v_time_str := to_char(v_now at time zone 'Asia/Jakarta', 'HH24:MI') || ' WIB';
  v_receipt  := 'REC-' || right(p_nis, 4) || '-' || upper(substr(md5(random()::text), 1, 4));

  update public.candidates set votes = votes + 1 where id = p_candidate_id;

  update public.students
     set has_voted        = true,
         voted_at         = v_time_str,
         receipt_id       = v_receipt,
         candidate_chosen = p_candidate_id
   where nis = p_nis;

  insert into public.vote_logs (id, timestamp, grade, masked_nis, candidate_number)
  values (
    'log-' || extract(epoch from v_now)::bigint::text || '-' || substr(md5(random()::text), 1, 4),
    v_time_str, v_student.grade, left(v_student.nis, 4) || '***', v_candidate.number
  );

  delete from public.vote_logs
   where id not in (select id from public.vote_logs order by created_at desc limit 30);

  update public.settings set last_updated = v_now where id = 1;

  return jsonb_build_object(
    'success', true,
    'message', 'Suara Anda berhasil dicatat secara sah ke dalam sistem Real Count!',
    'receiptId', v_receipt
  );
end;
$$;

revoke all on function public.cast_vote(text, bigint) from public;
grant execute on function public.cast_vote(text, bigint) to authenticated;

-- ---------------------------------------------------------------
-- RPC: admin_create_student(...)  — tambah 1 siswa + akun login
-- ---------------------------------------------------------------
create or replace function public.admin_create_student(
  p_nis text, p_nisn text, p_name text, p_grade text, p_gender text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  v_nis   text := btrim(p_nis);
  v_token text;
  v_email text;
  v_uid   uuid;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'message', 'Akses ditolak: hanya panitia.');
  end if;
  if v_nis = '' or btrim(coalesce(p_name, '')) = '' then
    return jsonb_build_object('success', false, 'message', 'NIS dan Nama siswa wajib diisi.');
  end if;
  if exists (select 1 from public.students where nis = v_nis) then
    return jsonb_build_object('success', false, 'message', 'NIS sudah terdaftar dalam DPT.');
  end if;

  v_email := v_nis || '@smus26garut.local';
  v_token := lpad((floor(random() * 1000000))::int::text, 6, '0');

  insert into public.students (nis, nisn, name, grade, gender, token)
  values (v_nis, nullif(btrim(coalesce(p_nisn, '')), ''), btrim(p_name),
          coalesce(nullif(btrim(coalesce(p_grade, '')), ''), 'X MIPA 1'),
          case when upper(coalesce(p_gender, 'L')) like 'P%' then 'P' else 'L' end);

  v_uid := gen_random_uuid();
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    created_at, updated_at
  ) values (
    v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    v_email, crypt(v_token, gen_salt('bf')), now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                       'nis', v_nis, 'role', 'student'),
    jsonb_build_object('nis', v_nis),
    '', '', '', '', now(), now()
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_uid,
    jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
    'email', v_uid::text, now(), now(), now()
  );

  update public.settings
     set total_voters = (select count(*) from public.students), last_updated = now()
   where id = 1;

  return jsonb_build_object('success', true, 'token', v_token,
    'message', 'Siswa berhasil ditambahkan ke DPT.');
end;
$$;

revoke all on function public.admin_create_student(text, text, text, text, text) from public;
grant execute on function public.admin_create_student(text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------
-- RPC: admin_import_students(p_rows jsonb) — impor massal dari Excel
-- ---------------------------------------------------------------
create or replace function public.admin_import_students(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  r           jsonb;
  v_nis       text;
  v_name      text;
  v_grade     text;
  v_gender    text;
  v_nisn      text;
  v_token     text;
  v_email     text;
  v_uid       uuid;
  v_imported  int := 0;
  v_updated   int := 0;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'imported', 0, 'updated', 0,
      'message', 'Akses ditolak: hanya panitia.');
  end if;

  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    v_nis  := btrim(coalesce(r ->> 'nis', ''));
    v_name := btrim(coalesce(r ->> 'name', ''));
    continue when v_nis = '' or v_name = '';

    v_grade  := coalesce(nullif(btrim(coalesce(r ->> 'grade', '')), ''), 'X MIPA 1');
    v_gender := case when upper(coalesce(r ->> 'gender', 'L')) like 'P%' then 'P' else 'L' end;
    v_nisn   := nullif(btrim(coalesce(r ->> 'nisn', '')), '');
    v_email  := v_nis || '@smus26garut.local';

    if exists (select 1 from public.students where nis = v_nis) then
      update public.students
         set name = v_name, grade = v_grade, gender = v_gender,
             nisn = coalesce(v_nisn, nisn)
       where nis = v_nis;
      v_updated := v_updated + 1;

      select token into v_token from public.students where nis = v_nis;
      if not exists (select 1 from auth.users where email = v_email) then
        v_uid := gen_random_uuid();
        insert into auth.users (
          id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data,
          confirmation_token, recovery_token, email_change_token_new, email_change,
          created_at, updated_at
        ) values (
          v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          v_email, crypt(v_token, gen_salt('bf')), now(),
          jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                             'nis', v_nis, 'role', 'student'),
          jsonb_build_object('nis', v_nis),
          '', '', '', '', now(), now()
        );
        insert into auth.identities (
          id, user_id, identity_data, provider, provider_id,
          last_sign_in_at, created_at, updated_at
        ) values (
          gen_random_uuid(), v_uid,
          jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
          'email', v_uid::text, now(), now(), now()
        );
      end if;
    else
      v_token := lpad((floor(random() * 1000000))::int::text, 6, '0');
      insert into public.students (nis, nisn, name, grade, gender, token)
      values (v_nis, v_nisn, v_name, v_grade, v_gender, v_token);

      v_uid := gen_random_uuid();
      insert into auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        created_at, updated_at
      ) values (
        v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        v_email, crypt(v_token, gen_salt('bf')), now(),
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                           'nis', v_nis, 'role', 'student'),
        jsonb_build_object('nis', v_nis),
        '', '', '', '', now(), now()
      );
      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
        'email', v_uid::text, now(), now(), now()
      );

      v_imported := v_imported + 1;
    end if;
  end loop;

  update public.settings
     set total_voters = (select count(*) from public.students), last_updated = now()
   where id = 1;

  return jsonb_build_object('success', true, 'imported', v_imported, 'updated', v_updated,
    'message', format('Berhasil memproses data: %s siswa baru ditambahkan ke DPT, %s siswa diperbarui.',
                      v_imported, v_updated));
end;
$$;

revoke all on function public.admin_import_students(jsonb) from public;
grant execute on function public.admin_import_students(jsonb) to authenticated;

-- ---------------------------------------------------------------
-- RPC: admin_regenerate_tokens() — acak ulang token + sinkron sandi login
-- ---------------------------------------------------------------
create or replace function public.admin_regenerate_tokens()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  rec     record;
  v_token text;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'message', 'Akses ditolak: hanya panitia.');
  end if;

  for rec in select nis from public.students loop
    v_token := lpad((floor(random() * 1000000))::int::text, 6, '0');
    update public.students set token = v_token where nis = rec.nis;
    update auth.users
       set encrypted_password = crypt(v_token, gen_salt('bf')), updated_at = now()
     where email = rec.nis || '@smus26garut.local';
  end loop;

  return jsonb_build_object('success', true,
    'message', 'Semua token pemilihan siswa berhasil diacak ulang.');
end;
$$;

revoke all on function public.admin_regenerate_tokens() from public;
grant execute on function public.admin_regenerate_tokens() to authenticated;

-- ---------------------------------------------------------------
-- RPC: admin_reset_data() — bersihkan hasil pemilihan (DPT & akun tetap)
-- ---------------------------------------------------------------
create or replace function public.admin_reset_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'message', 'Akses ditolak: hanya panitia.');
  end if;

  update public.candidates
     set votes = 0;

  update public.students
     set has_voted = false, voted_at = null, receipt_id = null, candidate_chosen = null;

  delete from public.vote_logs;

  update public.settings
     set is_open = true,
         total_voters = (select count(*) from public.students),
         last_updated = now()
   where id = 1;

  return jsonb_build_object('success', true,
    'message', 'Seluruh hasil pemilihan direset. DPT dan akun pemilih tetap dipertahankan.');
end;
$$;

revoke all on function public.admin_reset_data() from public;
grant execute on function public.admin_reset_data() to authenticated;

-- ---------------------------------------------------------------
-- DATA AWAL (dijalankan sekali)
-- ---------------------------------------------------------------
do $$
declare
  rec     record;
  v_token text;
  v_email text;
  v_uid   uuid;
begin
  -- Panitia / KPU (role=admin)
  for rec in select * from (values
      ('admin'), ('kpu_osis'), ('panitia')
    ) as t(username)
  loop
    v_email := rec.username || '@smus26garut.local';
    if not exists (select 1 from auth.users where email = v_email) then
      v_uid := gen_random_uuid();
      insert into auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        created_at, updated_at
      ) values (
        v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        v_email, crypt('osis2026', gen_salt('bf')), now(),
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                           'role', 'admin', 'username', rec.username),
        jsonb_build_object('username', rec.username),
        '', '', '', '', now(), now()
      );
      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
        'email', v_uid::text, now(), now(), now()
      );
    end if;
  end loop;

  -- Pengaturan pemilihan
  if not exists (select 1 from public.settings where id = 1) then
    insert into public.settings (
      id, school_name, school_address, logo_url, school_year,
      election_title, is_open, total_voters, scheduled_end
    ) values (
      1, 'SMA NEGERI 26 GARUT', 'Kp. Tegal Panjang Kec. Sucinaraja GARUT',
      'https://smanegeri26garut.wordpress.com/wp-content/uploads/2012/08/backup_of_logo-sucinaraja_fina1l-lat.jpg',
      '2026/2027', 'Pemilihan Raya Ketua & Wakil Ketua OSIS', true, 0, '15:00 WIB Hari Ini'
    );
  end if;

  -- Pasangan calon
  if not exists (select 1 from public.candidates) then
    insert into public.candidates (id, number, chairman_name, vice_chairman_name, photo_url, slogan, vision, mission, work_programs, votes, color)
    values
    (1, 1, 'Raditya Pratama', 'Annisa Rahmawati',
     '/src/assets/images/paslon_satu_1793931489291.jpg',
     'OSIS Proaktif, Kolaboratif, dan Berkarakter Juara',
     'Mewujudkan OSIS SMA NEGERI 26 GARUT sebagai wadah aspirasi yang inklusif, adaptif terhadap kemajuan teknologi, serta melahirkan siswa yang berintegritas dan berprestasi tingkat nasional.',
     '["Meningkatkan transparansi dan komunikasi aspirasi siswa melalui platform digital OSIS terpadu.","Mengembangkan minat dan bakat siswa di bidang sains, teknologi digital, olahraga, dan seni kreasi.","Menggalakkan kepedulian lingkungan hidup dan gerakan zero waste di seluruh lingkungan sekolah.","Mempererat tali silaturahmi dan solidaritas antar-ekstrakurikuler serta antar-angkatan."]'::jsonb,
     '[{"title":"CreatiFest & Digital Expo","description":"Pekan kreativitas tahunan siswa berupa pameran karya teknologi, startup siswa, bazar kreatif, dan pagelaran musik seni."},{"title":"Ruang Aspirasi \"Curhat OSIS\"","description":"Kotak suara dan kanal konsultasi digital yang aman untuk menyalurkan kritik, saran, serta kebutuhan siswa ke pihak sekolah."},{"title":"Gerakan Sekolah Hijau (Eco-School)","description":"Optimalisasi bank sampah sekolah, pemilahan limbah plastik, dan penanaman hidroponik di area terbuka hijau sekolah."}]'::jsonb,
     31, '{"primary":"#2563eb","light":"#eff6ff","border":"#bfdbfe","ring":"ring-blue-500","bgHover":"hover:bg-blue-50","badge":"bg-blue-600 text-white","text":"text-blue-700"}'::jsonb),
    (2, 2, 'Muhammad Fajar', 'Siti Zahra Khairunnisa',
     '/src/assets/images/paslon_dua_1793931490711.jpg',
     'Sinergi Inovasi, Integritas, dan Kepedulian untuk Generasi Unggul',
     'Menjadikan OSIS sebagai pusat pengembangan kepemimpinan pemuda yang kritis, berjiwa sosial tinggi, serta siap menghadapi tantangan era global dengan tetap menjunjung etika kesantunan.',
     '["Menyelenggarakan pelatihan kepemimpinan dan public speaking bersertifikat untuk seluruh perwakilan kelas.","Membangun jejaring kolaborasi dengan universitas terkemuka dan alumni inspiratif untuk bimbingan karir.","Mengaktifkan kembali kompetisi olahraga, debat ilmiah, dan e-sports antarkelas (Class Meeting berkualitas).","Memperkuat program bakti sosial dan tanggap bencana pemuda di lingkungan masyarakat sekitar."]'::jsonb,
     '[{"title":"Youth Leadership & Career Mentoring","description":"Workshop rutin bersama alumni berprestasi mengenai beasiswa, seleksi masuk PTN, dan kepemimpinan organisasi."},{"title":"Nusantara Cup & E-Sports League","description":"Kompetisi tahunan futsal, basket, bulutangkis, serta turnamen e-sport bernilai sportivitas tinggi."},{"title":"Peduli Kasih & Sahabat Mengajar","description":"Aksi sosial berkala OSIS membantu anak-anak di panti asuhan dan penyaluran bantuan buku ke perpustakaan desa."}]'::jsonb,
     24, '{"primary":"#059669","light":"#ecfdf5","border":"#a7f3d0","ring":"ring-emerald-500","bgHover":"hover:bg-emerald-50","badge":"bg-emerald-600 text-white","text":"text-emerald-700"}'::jsonb),
    (3, 3, 'Dimas Arya Sena', 'Clarissa Aurelia',
     '/src/assets/images/paslon_tiga_1793931490345.jpg',
     'Budaya Sekolah Asik, Kreatif, dan Berprestasi Tanpa Batas',
     'Membangun ekosistem sekolah yang menyenangkan, mendukung kesehatan mental siswa, memicu lahirnya karya-karya orisinal bernilai seni tinggi, dan berdaya saing antarsekolah.',
     '["Menciptakan iklim belajar yang ramah siswa dengan program relaksasi dan dukungan konseling sebaya.","Mewadahi bakat konten kreatif, fotografi, videografi, dan literasi lewat media publikasi sekolah.","Memodernisasi sistem inventaris perlengkapan ekstrakurikuler agar mudah dipinjam.","Mengadakan dialog terbuka berkala antara pengurus OSIS, MPK, dan perwakilan kelas setiap bulan."]'::jsonb,
     '[{"title":"Podcast \"Suara Siswa Nusantara\"","description":"Siaran bincang-bincang inspiratif di YouTube & Spotify sekolah membahas prestasi siswa, karya seni, dan tips belajar."},{"title":"Pekan Seni & Budaya Multikultural","description":"Festival kostum adat, kuliner daerah nusantara, pameran fotografi, dan lomba tari kreasi tradisional modern."},{"title":"Mental Health Corner & Peer Support","description":"Program pendampingan teman sebaya dan seminar psikologi remaja untuk meminimalisasi stres jelang ujian."}]'::jsonb,
     16, '{"primary":"#b91c1c","light":"#fef2f2","border":"#fecaca","ring":"ring-rose-500","bgHover":"hover:bg-rose-50","badge":"bg-rose-600 text-white","text":"text-rose-700"}'::jsonb);
  end if;

  -- DPT siswa + akun login siswa
  if not exists (select 1 from public.students) then
    for rec in select * from (values
      ('2026001', null::text, 'Ahmad Rizky Pratama',      'X MIPA 1',  'L', true,  '08:15 WIB', 'REC-2601-A9F'),
      ('2026002', null,       'Alya Putri Salsabila',     'X MIPA 1',  'P', true,  '08:22 WIB', 'REC-2602-C7E'),
      ('2026003', null,       'Bayu Aditya Putra',        'X MIPA 1',  'L', false, null,        null),
      ('2026004', null,       'Citra Dewi Anggraini',     'X MIPA 1',  'P', true,  '08:35 WIB', 'REC-2604-D1B'),
      ('2026005', null,       'Danendra Wicaksono',       'X MIPA 1',  'L', false, null,        null),
      ('2026006', null,       'Eka Lestari Rahayu',       'X MIPA 1',  'P', false, null,        null),
      ('2026011', null,       'Fadhil Arkananta',         'X MIPA 2',  'L', true,  '08:42 WIB', 'REC-2611-F3A'),
      ('2026012', null,       'Gita Maharani',            'X MIPA 2',  'P', true,  '08:50 WIB', 'REC-2612-G8K'),
      ('2026013', null,       'Hafiz Surya Al-Ghifari',   'X MIPA 2',  'L', false, null,        null),
      ('2026014', null,       'Indah Permata Sari',       'X MIPA 2',  'P', false, null,        null),
      ('2026015', null,       'Jevon Nathanel',           'X MIPA 2',  'L', true,  '09:02 WIB', 'REC-2615-J4C'),
      ('2026021', null,       'Kania Safira',             'X IPS 1',   'P', true,  '09:12 WIB', 'REC-2621-K9X'),
      ('2026022', null,       'Lukman Hakim',             'X IPS 1',   'L', false, null,        null),
      ('2026023', null,       'Maudy Ayunda Putri',       'X IPS 1',   'P', false, null,        null),
      ('2026024', null,       'Naufal Izzaturahman',      'X IPS 1',   'L', true,  '09:25 WIB', 'REC-2624-N2P'),
      ('2026025', null,       'Olivia Clarissa',          'X IPS 1',   'P', false, null,        null),
      ('2025001', null,       'Pandu Satria Utama',       'XI MIPA 1', 'L', true,  '09:33 WIB', 'REC-2501-P7T'),
      ('2025002', null,       'Qonita Nailah',            'XI MIPA 1', 'P', true,  '09:41 WIB', 'REC-2502-Q1M'),
      ('2025003', null,       'Raka Mahardika',           'XI MIPA 1', 'L', false, null,        null),
      ('2025004', null,       'Syifa Nurul Izzati',       'XI MIPA 1', 'P', true,  '09:55 WIB', 'REC-2504-S5R'),
      ('2025005', null,       'Tegar Budi Perkasa',       'XI MIPA 1', 'L', false, null,        null),
      ('2025011', null,       'Ulya Rahadatul',           'XI MIPA 2', 'P', true,  '10:05 WIB', 'REC-2511-U8L'),
      ('2025012', null,       'Vino Bastian Ardiansyah',  'XI MIPA 2', 'L', false, null,        null),
      ('2025013', null,       'Wulan Dwi Angesti',        'XI MIPA 2', 'P', true,  '10:14 WIB', 'REC-2513-W3K'),
      ('2025014', null,       'Xavier Kevin Chandra',     'XI MIPA 2', 'L', false, null,        null),
      ('2025015', null,       'Yasmin Khansa',            'XI MIPA 2', 'P', true,  '10:22 WIB', 'REC-2515-Y9Z'),
      ('2025021', null,       'Zidane Al-Farizi',         'XI IPS 1',  'L', true,  '10:30 WIB', 'REC-2521-Z4Q'),
      ('2025022', null,       'Anindya Kusuma',           'XI IPS 1',  'P', false, null,        null),
      ('2025023', null,       'Bagas Mahendra',           'XI IPS 1',  'L', true,  '10:45 WIB', 'REC-2522-B6H'),
      ('2025024', null,       'Chelsea Olivia',           'XI IPS 1',  'P', false, null,        null),
      ('2025025', null,       'Davin Prasetyo',           'XI IPS 1',  'L', false, null,        null),
      ('2024001', null,       'Erlangga Yudha',           'XII MIPA 1','L', true,  '11:02 WIB', 'REC-2401-E2V'),
      ('2024002', null,       'Farah Nadia',              'XII MIPA 1','P', true,  '11:10 WIB', 'REC-2402-F9C'),
      ('2024003', null,       'Galih Wicaksono',          'XII MIPA 1','L', false, null,        null),
      ('2024004', null,       'Hani Amalia',              'XII MIPA 1','P', true,  '11:18 WIB', 'REC-2404-H5W'),
      ('2024005', null,       'Irfan Maulana',            'XII MIPA 1','L', false, null,        null),
      ('2024011', null,       'Jessica Alvina',           'XII MIPA 2','P', true,  '11:27 WIB', 'REC-2411-J7S'),
      ('2024012', null,       'Krisna Dewantara',         'XII MIPA 2','L', false, null,        null),
      ('2024013', null,       'Larasati Putri',           'XII MIPA 2','P', true,  '11:35 WIB', 'REC-2413-L3D'),
      ('2024014', null,       'Mario Teguh Santoso',      'XII MIPA 2','L', false, null,        null),
      ('2024015', null,       'Nadya Amanda',             'XII MIPA 2','P', true,  '11:43 WIB', 'REC-2415-N8R'),
      ('2024021', null,       'Oki Setiawan',             'XII IPS 1', 'L', true,  '11:51 WIB', 'REC-2421-O1P'),
      ('2024022', null,       'Prita Wardani',            'XII IPS 1', 'P', false, null,        null),
      ('2024023', null,       'Rendy Firmansyah',         'XII IPS 1', 'L', true,  '12:05 WIB', 'REC-2423-R5X'),
      ('2024024', null,       'Salsa Billa Khansa',       'XII IPS 1', 'P', false, null,        null),
      ('2024025', null,       'Thoriq Aziz',              'XII IPS 1', 'L', false, null,        null),
      ('2024026', null,       'Vanya Aurel',              'XII IPS 1', 'P', true,  '12:15 WIB', 'REC-2426-V9B'),
      ('2024027', null,       'Wahyu Ramadhan',           'XII IPS 1', 'L', false, null,        null),
      ('2024028', null,       'Zahrotul Muna',            'XII IPS 1', 'P', false, null,        null)
    ) as t(nis, nisn, name, grade, gender, has_voted, voted_at, receipt_id)
    loop
      v_token := lpad((floor(random() * 1000000))::int::text, 6, '0');
      v_email := rec.nis || '@smus26garut.local';

      insert into public.students (nis, nisn, name, grade, gender, token, has_voted, voted_at, receipt_id)
      values (rec.nis, rec.nisn, rec.name, rec.grade, rec.gender, v_token,
              rec.has_voted, rec.voted_at, rec.receipt_id);

      v_uid := gen_random_uuid();
      insert into auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        created_at, updated_at
      ) values (
        v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        v_email, crypt(v_token, gen_salt('bf')), now(),
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                           'nis', rec.nis, 'role', 'student'),
        jsonb_build_object('nis', rec.nis),
        '', '', '', '', now(), now()
      );
      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
        'email', v_uid::text, now(), now(), now()
      );
    end loop;
  end if;

  -- Riwayat log suara terakhir (contoh awal)
  if not exists (select 1 from public.vote_logs) then
    insert into public.vote_logs (id, timestamp, grade, masked_nis, candidate_number)
    values
      ('log-1', '12:15 WIB', 'XII IPS 1',  '2024***', 1),
      ('log-2', '12:05 WIB', 'XII IPS 1',  '2024***', 2),
      ('log-3', '11:51 WIB', 'XII IPS 1',  '2024***', 1),
      ('log-4', '11:43 WIB', 'XII MIPA 2', '2024***', 3),
      ('log-5', '11:35 WIB', 'XII MIPA 2', '2024***', 2),
      ('log-6', '11:27 WIB', 'XII MIPA 2', '2024***', 1),
      ('log-7', '11:18 WIB', 'XII MIPA 1', '2024***', 1),
      ('log-8', '11:10 WIB', 'XII MIPA 1', '2024***', 2);
  end if;

  update public.settings
     set total_voters = (select count(*) from public.students)
   where id = 1;
end $$;

-- ---------------------------------------------------------------
-- RPC: admin_list_users() — daftar akun panitia (role=admin)
-- ---------------------------------------------------------------
create or replace function public.admin_list_users()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    return '[]'::jsonb;
  end if;

  select coalesce(
           jsonb_agg(
             jsonb_build_object(
               'id', u.id,
               'username', coalesce(u.raw_app_meta_data ->> 'username', split_part(u.email, '@', 1)),
               'name', coalesce(nullif(u.raw_user_meta_data ->> 'name', ''),
                                u.raw_app_meta_data ->> 'username',
                                split_part(u.email, '@', 1)),
               'createdAt', u.created_at,
               'lastSignInAt', u.last_sign_in_at
             ) order by u.created_at
           ), '[]'::jsonb)
    into v_result
    from auth.users u
   where u.raw_app_meta_data ->> 'role' = 'admin';

  return v_result;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

-- ---------------------------------------------------------------
-- RPC: admin_create_user(username, name, password) — tambah akun panitia
-- ---------------------------------------------------------------
create or replace function public.admin_create_user(
  p_username text, p_name text, p_password text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  v_username text := lower(btrim(coalesce(p_username, '')));
  v_name     text := btrim(coalesce(p_name, ''));
  v_pass     text := coalesce(p_password, '');
  v_email    text;
  v_uid      uuid;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'message', 'Akses ditolak: hanya panitia.');
  end if;
  if v_username = '' or v_name = '' then
    return jsonb_build_object('success', false, 'message', 'Username dan Nama wajib diisi.');
  end if;
  if v_username !~ '^[a-z0-9_.]+$' then
    return jsonb_build_object('success', false,
      'message', 'Username hanya boleh huruf kecil, angka, titik, dan garis bawah (tanpa spasi).');
  end if;
  if length(v_pass) < 6 then
    return jsonb_build_object('success', false, 'message', 'Kata sandi minimal 6 karakter.');
  end if;

  v_email := v_username || '@smus26garut.local';
  if exists (select 1 from auth.users where email = v_email) then
    return jsonb_build_object('success', false, 'message', 'Username sudah digunakan oleh akun lain.');
  end if;

  v_uid := gen_random_uuid();
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    created_at, updated_at
  ) values (
    v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    v_email, crypt(v_pass, gen_salt('bf')), now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                       'role', 'admin', 'username', v_username),
    jsonb_build_object('username', v_username, 'name', v_name),
    '', '', '', '', now(), now()
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_uid,
    jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
    'email', v_uid::text, now(), now(), now()
  );

  return jsonb_build_object('success', true,
    'message', 'Pengguna panitia berhasil ditambahkan.');
end;
$$;

revoke all on function public.admin_create_user(text, text, text) from public;
grant execute on function public.admin_create_user(text, text, text) to authenticated;

-- ---------------------------------------------------------------
-- RPC: admin_update_user(id, username, name, password) — edit akun panitia
-- p_password boleh kosong (''), artinya sandi tidak diubah.
-- ---------------------------------------------------------------
create or replace function public.admin_update_user(
  p_user_id uuid, p_username text, p_name text, p_password text
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  v_username text := lower(btrim(coalesce(p_username, '')));
  v_name     text := btrim(coalesce(p_name, ''));
  v_pass     text := coalesce(p_password, '');
  v_email    text;
  v_old_email text;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'message', 'Akses ditolak: hanya panitia.');
  end if;
  if v_username = '' or v_name = '' then
    return jsonb_build_object('success', false, 'message', 'Username dan Nama wajib diisi.');
  end if;
  if v_username !~ '^[a-z0-9_.]+$' then
    return jsonb_build_object('success', false,
      'message', 'Username hanya boleh huruf kecil, angka, titik, dan garis bawah (tanpa spasi).');
  end if;
  if length(v_pass) > 0 and length(v_pass) < 6 then
    return jsonb_build_object('success', false, 'message', 'Kata sandi minimal 6 karakter.');
  end if;

  select email into v_old_email
    from auth.users
   where id = p_user_id and raw_app_meta_data ->> 'role' = 'admin';
  if v_old_email is null then
    return jsonb_build_object('success', false, 'message', 'Pengguna panitia tidak ditemukan.');
  end if;

  v_email := v_username || '@smus26garut.local';
  if v_email <> v_old_email and exists (select 1 from auth.users where email = v_email) then
    return jsonb_build_object('success', false, 'message', 'Username sudah digunakan oleh akun lain.');
  end if;

  update auth.users
     set email = v_email,
         raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                              || jsonb_build_object('role', 'admin', 'username', v_username),
         raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
                              || jsonb_build_object('username', v_username, 'name', v_name),
         updated_at = now()
   where id = p_user_id;

  update auth.identities
     set identity_data = jsonb_build_object(
           'sub', p_user_id::text, 'email', v_email, 'email_verified', true),
         updated_at = now()
   where user_id = p_user_id and provider = 'email';

  if length(v_pass) > 0 then
    update auth.users
       set encrypted_password = crypt(v_pass, gen_salt('bf')), updated_at = now()
     where id = p_user_id;
  end if;

  return jsonb_build_object('success', true,
    'message', 'Data pengguna panitia berhasil diperbarui.');
end;
$$;

revoke all on function public.admin_update_user(uuid, text, text, text) from public;
grant execute on function public.admin_update_user(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------
-- RPC: admin_delete_user(id) — hapus akun panitia
-- Tidak boleh menghapus akun sendiri ataupun akun panitia terakhir.
-- ---------------------------------------------------------------
create or replace function public.admin_delete_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_admin_count int;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'message', 'Akses ditolak: hanya panitia.');
  end if;

  if p_user_id = auth.uid() then
    return jsonb_build_object('success', false,
      'message', 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
  end if;

  if not exists (
    select 1 from auth.users where id = p_user_id and raw_app_meta_data ->> 'role' = 'admin'
  ) then
    return jsonb_build_object('success', false, 'message', 'Pengguna panitia tidak ditemukan.');
  end if;

  select count(*) into v_admin_count from auth.users where raw_app_meta_data ->> 'role' = 'admin';
  if v_admin_count <= 1 then
    return jsonb_build_object('success', false, 'message', 'Minimal harus ada satu akun panitia.');
  end if;

  delete from auth.identities where user_id = p_user_id;
  delete from auth.users where id = p_user_id;

  return jsonb_build_object('success', true,
    'message', 'Pengguna panitia berhasil dihapus.');
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- ---------------------------------------------------------------
-- VIEW: admin_users — daftar akun panitia (hanya baca / read-only)
--
-- Catatan: akun panitia aslinya tersimpan di auth.users
-- (menu Authentication > Users). View ini dibuat supaya daftarnya
-- ikut muncul di Table Editor Supabase agar mudah dilihat.
-- Untuk menambah / mengubah / menghapus akun, gunakan panel
-- "Kelola Pengguna Panitia" di aplikasi (validasi + keamanan
-- ditangani oleh fungsi RPC di atas).
-- ---------------------------------------------------------------
create or replace view public.admin_users as
select
  u.id,
  coalesce(u.raw_app_meta_data ->> 'username', split_part(u.email, '@', 1)) as username,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'name', ''),
    u.raw_app_meta_data ->> 'username',
    split_part(u.email, '@', 1)
  ) as name,
  u.email,
  u.created_at,
  u.last_sign_in_at
from auth.users u
where u.raw_app_meta_data ->> 'role' = 'admin';

comment on view public.admin_users is
  'Daftar akun panitia (read-only). Sumber data: auth.users. Kelola melalui panel aplikasi.';

revoke all on public.admin_users from anon, public;
grant select on public.admin_users to authenticated;
