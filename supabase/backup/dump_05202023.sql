--
-- PostgreSQL database dump
--

-- Dumped from database version 15.1
-- Dumped by pg_dump version 15.2

-- Started on 2023-05-20 00:35:38

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 21 (class 2615 OID 16488)
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- TOC entry 40 (class 2615 OID 29019)
-- Name: bakery; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA bakery;


ALTER SCHEMA bakery OWNER TO postgres;

--
-- TOC entry 19 (class 2615 OID 16387)
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- TOC entry 25 (class 2615 OID 16618)
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- TOC entry 23 (class 2615 OID 16607)
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- TOC entry 14 (class 2615 OID 16385)
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- TOC entry 27 (class 2615 OID 16643)
-- Name: pgsodium; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA pgsodium;


ALTER SCHEMA pgsodium OWNER TO supabase_admin;

--
-- TOC entry 7 (class 3079 OID 16644)
-- Name: pgsodium; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgsodium WITH SCHEMA pgsodium;


--
-- TOC entry 4236 (class 0 OID 0)
-- Dependencies: 7
-- Name: EXTENSION pgsodium; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgsodium IS 'Pgsodium is a modern cryptography library for Postgres.';


--
-- TOC entry 33 (class 2615 OID 16978)
-- Name: pgtle; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA pgtle;


ALTER SCHEMA pgtle OWNER TO supabase_admin;

--
-- TOC entry 22 (class 2615 OID 16599)
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- TOC entry 20 (class 2615 OID 16536)
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- TOC entry 30 (class 2615 OID 16946)
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- TOC entry 6 (class 3079 OID 16633)
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- TOC entry 4240 (class 0 OID 0)
-- Dependencies: 6
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- TOC entry 2 (class 3079 OID 16388)
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- TOC entry 4241 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- TOC entry 4 (class 3079 OID 16434)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- TOC entry 4242 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 5 (class 3079 OID 16471)
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;


--
-- TOC entry 4243 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION pgjwt; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgjwt IS 'JSON Web Token API for Postgresql';


--
-- TOC entry 8 (class 3079 OID 16947)
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- TOC entry 4244 (class 0 OID 0)
-- Dependencies: 8
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- TOC entry 3 (class 3079 OID 16423)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- TOC entry 4245 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 1283 (class 1247 OID 28406)
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- TOC entry 1307 (class 1247 OID 28547)
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- TOC entry 1280 (class 1247 OID 28400)
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- TOC entry 1277 (class 1247 OID 28394)
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1268 (class 1247 OID 29176)
-- Name: task_status; Type: TYPE; Schema: bakery; Owner: postgres
--

CREATE TYPE bakery.task_status AS ENUM (
    'created',
    'in_progress',
    'done',
    'removed'
);


ALTER TYPE bakery.task_status OWNER TO postgres;

--
-- TOC entry 1352 (class 1247 OID 34248)
-- Name: expensecategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.expensecategory AS ENUM (
    'officeSupply',
    'stockIngredient',
    'tools',
    'software',
    'parcel',
    'travel',
    'facilities',
    'rent',
    'marketing',
    'other'
);


ALTER TYPE public.expensecategory OWNER TO postgres;

--
-- TOC entry 1334 (class 1247 OID 34160)
-- Name: expirationstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.expirationstatus AS ENUM (
    'fresh',
    'expired'
);


ALTER TYPE public.expirationstatus OWNER TO postgres;

--
-- TOC entry 1316 (class 1247 OID 28818)
-- Name: fulfillment_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.fulfillment_type AS ENUM (
    'pickup',
    'delivery'
);


ALTER TYPE public.fulfillment_type OWNER TO postgres;

--
-- TOC entry 1325 (class 1247 OID 34136)
-- Name: fulfillmenttype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.fulfillmenttype AS ENUM (
    'pickup',
    'delivery'
);


ALTER TYPE public.fulfillmenttype OWNER TO postgres;

--
-- TOC entry 1349 (class 1247 OID 34242)
-- Name: invoicelogtype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.invoicelogtype AS ENUM (
    'created',
    'statusChange'
);


ALTER TYPE public.invoicelogtype OWNER TO postgres;

--
-- TOC entry 1346 (class 1247 OID 34218)
-- Name: invoicestatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.invoicestatus AS ENUM (
    'draft',
    'pending',
    'sent',
    'paymentPending',
    'paymentPartial',
    'paymentFull',
    'closed',
    'overdue',
    'void',
    'refunded',
    'disputed'
);


ALTER TYPE public.invoicestatus OWNER TO postgres;

--
-- TOC entry 1343 (class 1247 OID 34214)
-- Name: invoicetype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.invoicetype AS ENUM (
    'order'
);


ALTER TYPE public.invoicetype OWNER TO postgres;

--
-- TOC entry 1319 (class 1247 OID 28824)
-- Name: job_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.job_status AS ENUM (
    'created',
    'in_progress',
    'done',
    'removed'
);


ALTER TYPE public.job_status OWNER TO postgres;

--
-- TOC entry 1313 (class 1247 OID 28732)
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'created',
    'in_progress',
    'ready_for_delivery',
    'delivered',
    'canceled'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- TOC entry 1322 (class 1247 OID 34124)
-- Name: orderstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.orderstatus AS ENUM (
    'created',
    'inProgress',
    'readyForDelivery',
    'delivered',
    'cancelled'
);


ALTER TYPE public.orderstatus OWNER TO postgres;

--
-- TOC entry 1340 (class 1247 OID 34206)
-- Name: paymentmethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.paymentmethod AS ENUM (
    'cash',
    'card',
    'digital'
);


ALTER TYPE public.paymentmethod OWNER TO postgres;

--
-- TOC entry 1355 (class 1247 OID 34270)
-- Name: state; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.state AS ENUM (
    'AL',
    'AK',
    'AZ',
    'AR',
    'AS',
    'CA',
    'CO',
    'CT',
    'DE',
    'DC',
    'FL',
    'GA',
    'GU',
    'HI',
    'ID',
    'IL',
    'IN',
    'IA',
    'KS',
    'KY',
    'LA',
    'ME',
    'MD',
    'MA',
    'MI',
    'MN',
    'MS',
    'MO',
    'MT',
    'NE',
    'NV',
    'NH',
    'NJ',
    'NM',
    'NY',
    'NC',
    'ND',
    'MP',
    'OH',
    'OK',
    'OR',
    'PA',
    'PR',
    'RI',
    'SC',
    'SD',
    'TN',
    'TX',
    'TT',
    'UT',
    'VT',
    'VA',
    'VI',
    'WA',
    'WV',
    'WI',
    'WY'
);


ALTER TYPE public.state OWNER TO postgres;

--
-- TOC entry 1331 (class 1247 OID 34152)
-- Name: supplystatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.supplystatus AS ENUM (
    'sufficient',
    'conflict',
    'insufficient'
);


ALTER TYPE public.supplystatus OWNER TO postgres;

--
-- TOC entry 1265 (class 1247 OID 29150)
-- Name: task_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.task_status AS ENUM (
    'created',
    'in_progress',
    'done',
    'removed'
);


ALTER TYPE public.task_status OWNER TO postgres;

--
-- TOC entry 1328 (class 1247 OID 34142)
-- Name: taskstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.taskstatus AS ENUM (
    'created',
    'inProgress',
    'done',
    'removed'
);


ALTER TYPE public.taskstatus OWNER TO postgres;

--
-- TOC entry 1337 (class 1247 OID 34166)
-- Name: unit; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.unit AS ENUM (
    'gram',
    'ounce',
    'pound',
    'teaspoon',
    'tablespoon',
    'cup',
    'quart',
    'gallon',
    'milliliter',
    'liter',
    'bags',
    'boxes',
    'cartons',
    'pallets',
    'bottles',
    'containers',
    'bunch',
    'dash',
    'pinch'
);


ALTER TYPE public.unit OWNER TO postgres;

--
-- TOC entry 371 (class 1255 OID 16534)
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- TOC entry 4246 (class 0 OID 0)
-- Dependencies: 371
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- TOC entry 571 (class 1255 OID 28376)
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- TOC entry 370 (class 1255 OID 16533)
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- TOC entry 4249 (class 0 OID 0)
-- Dependencies: 370
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- TOC entry 366 (class 1255 OID 16532)
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- TOC entry 4251 (class 0 OID 0)
-- Dependencies: 366
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- TOC entry 536 (class 1255 OID 16591)
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: postgres
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  schema_is_cron bool;
BEGIN
  schema_is_cron = (
    SELECT n.nspname = 'cron'
    FROM pg_event_trigger_ddl_commands() AS ev
    LEFT JOIN pg_catalog.pg_namespace AS n
      ON ev.objid = n.oid
  );

  IF schema_is_cron
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;

  END IF;

END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO postgres;

--
-- TOC entry 4268 (class 0 OID 0)
-- Dependencies: 536
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: postgres
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- TOC entry 384 (class 1255 OID 16612)
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- TOC entry 4270 (class 0 OID 0)
-- Dependencies: 384
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- TOC entry 569 (class 1255 OID 16593)
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: postgres
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

    REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

    GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO postgres;

--
-- TOC entry 4272 (class 0 OID 0)
-- Dependencies: 569
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: postgres
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- TOC entry 382 (class 1255 OID 16603)
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- TOC entry 383 (class 1255 OID 16604)
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- TOC entry 570 (class 1255 OID 16614)
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- TOC entry 4301 (class 0 OID 0)
-- Dependencies: 570
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- TOC entry 348 (class 1255 OID 16386)
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: postgres
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RAISE WARNING 'PgBouncer auth request: %', p_usename;

    RETURN QUERY
    SELECT usename::TEXT, passwd::TEXT FROM pg_catalog.pg_shadow
    WHERE usename = p_usename;
END;
$$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO postgres;

--
-- TOC entry 575 (class 1255 OID 28583)
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- TOC entry 369 (class 1255 OID 16580)
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
    select string_to_array(name, '/') into _parts;
    select _parts[array_length(_parts,1)] into _filename;
    -- @todo return the last part instead of 2
    return split_part(_filename, '.', 2);
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 368 (class 1255 OID 16579)
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
    select string_to_array(name, '/') into _parts;
    return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 367 (class 1255 OID 16578)
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
    select string_to_array(name, '/') into _parts;
    return _parts[1:array_length(_parts,1)-1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 572 (class 1255 OID 28570)
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- TOC entry 573 (class 1255 OID 28572)
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(regexp_split_to_array(objects.name, ''/''), 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(regexp_split_to_array(objects.name, ''/''), 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- TOC entry 574 (class 1255 OID 28573)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

--
-- TOC entry 533 (class 1255 OID 16971)
-- Name: secrets_encrypt_secret_secret(); Type: FUNCTION; Schema: vault; Owner: supabase_admin
--

CREATE FUNCTION vault.secrets_encrypt_secret_secret() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
		BEGIN
		        new.secret = CASE WHEN new.secret IS NULL THEN NULL ELSE
			CASE WHEN new.key_id IS NULL THEN NULL ELSE pg_catalog.encode(
			  pgsodium.crypto_aead_det_encrypt(
				pg_catalog.convert_to(new.secret, 'utf8'),
				pg_catalog.convert_to((new.id::text || new.description::text || new.created_at::text || new.updated_at::text)::text, 'utf8'),
				new.key_id::uuid,
				new.nonce
			  ),
				'base64') END END;
		RETURN new;
		END;
		$$;


ALTER FUNCTION vault.secrets_encrypt_secret_secret() OWNER TO supabase_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 265 (class 1259 OID 16519)
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- TOC entry 4330 (class 0 OID 0)
-- Dependencies: 265
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- TOC entry 295 (class 1259 OID 28551)
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- TOC entry 4332 (class 0 OID 0)
-- Dependencies: 295
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- TOC entry 286 (class 1259 OID 28348)
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- TOC entry 4334 (class 0 OID 0)
-- Dependencies: 286
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- TOC entry 4335 (class 0 OID 0)
-- Dependencies: 286
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- TOC entry 264 (class 1259 OID 16512)
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- TOC entry 4337 (class 0 OID 0)
-- Dependencies: 264
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- TOC entry 290 (class 1259 OID 28438)
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- TOC entry 4339 (class 0 OID 0)
-- Dependencies: 290
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- TOC entry 289 (class 1259 OID 28426)
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- TOC entry 4341 (class 0 OID 0)
-- Dependencies: 289
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- TOC entry 288 (class 1259 OID 28413)
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- TOC entry 4343 (class 0 OID 0)
-- Dependencies: 288
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- TOC entry 263 (class 1259 OID 16501)
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- TOC entry 4345 (class 0 OID 0)
-- Dependencies: 263
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- TOC entry 262 (class 1259 OID 16500)
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- TOC entry 4347 (class 0 OID 0)
-- Dependencies: 262
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- TOC entry 293 (class 1259 OID 28480)
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- TOC entry 4349 (class 0 OID 0)
-- Dependencies: 293
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- TOC entry 294 (class 1259 OID 28498)
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    from_ip_address inet,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- TOC entry 4351 (class 0 OID 0)
-- Dependencies: 294
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- TOC entry 266 (class 1259 OID 16527)
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- TOC entry 4353 (class 0 OID 0)
-- Dependencies: 266
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- TOC entry 287 (class 1259 OID 28378)
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- TOC entry 4355 (class 0 OID 0)
-- Dependencies: 287
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- TOC entry 4356 (class 0 OID 0)
-- Dependencies: 287
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- TOC entry 292 (class 1259 OID 28465)
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- TOC entry 4358 (class 0 OID 0)
-- Dependencies: 292
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- TOC entry 291 (class 1259 OID 28456)
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- TOC entry 4360 (class 0 OID 0)
-- Dependencies: 291
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- TOC entry 4361 (class 0 OID 0)
-- Dependencies: 291
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- TOC entry 261 (class 1259 OID 16489)
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- TOC entry 4363 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- TOC entry 4364 (class 0 OID 0)
-- Dependencies: 261
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- TOC entry 306 (class 1259 OID 34568)
-- Name: clients; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery.clients (
    "clientID" integer NOT NULL,
    "personID" integer NOT NULL,
    "createdTime" timestamp without time zone NOT NULL
);


ALTER TABLE bakery.clients OWNER TO postgres;

--
-- TOC entry 307 (class 1259 OID 34571)
-- Name: clients_clientID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery.clients ALTER COLUMN "clientID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."clients_clientID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 296 (class 1259 OID 34417)
-- Name: expenses; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery.expenses (
    "expenseID" integer NOT NULL,
    "createdTime" timestamp without time zone NOT NULL,
    "transactionDate" date NOT NULL,
    name character varying NOT NULL,
    description text,
    amount numeric NOT NULL,
    supplier character varying NOT NULL,
    method public.paymentmethod NOT NULL,
    "receiptID" integer NOT NULL,
    purchaser character varying NOT NULL,
    category public.expensecategory NOT NULL
);


ALTER TABLE bakery.expenses OWNER TO postgres;

--
-- TOC entry 297 (class 1259 OID 34420)
-- Name: expenses_expenseID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery.expenses ALTER COLUMN "expenseID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."expenses_expenseID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 342 (class 1259 OID 35181)
-- Name: ingredientStockID; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."ingredientStockID" (
    "ingredientStockID" integer NOT NULL,
    "ingredientID" integer NOT NULL,
    "measurementUnit" public.unit NOT NULL,
    measurement numeric NOT NULL,
    "purchasedBy" character varying NOT NULL,
    "purchasedDate" date NOT NULL
);


ALTER TABLE bakery."ingredientStockID" OWNER TO postgres;

--
-- TOC entry 343 (class 1259 OID 35184)
-- Name: ingredientStockID_ingredientStockID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."ingredientStockID" ALTER COLUMN "ingredientStockID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."ingredientStockID_ingredientStockID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 338 (class 1259 OID 35149)
-- Name: ingredients; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery.ingredients (
    "ingredientID" integer NOT NULL,
    name character varying NOT NULL,
    "ifespanDays" smallint NOT NULL
);


ALTER TABLE bakery.ingredients OWNER TO postgres;

--
-- TOC entry 339 (class 1259 OID 35152)
-- Name: ingredients_ingredientID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery.ingredients ALTER COLUMN "ingredientID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."ingredients_ingredientID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 322 (class 1259 OID 34869)
-- Name: invoiceLogs; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."invoiceLogs" (
    "invoiceLogID" bigint NOT NULL,
    "invoiceID" integer,
    type public.invoicelogtype NOT NULL,
    log text NOT NULL,
    "createdTime" timestamp without time zone NOT NULL
);


ALTER TABLE bakery."invoiceLogs" OWNER TO postgres;

--
-- TOC entry 323 (class 1259 OID 34872)
-- Name: invoiceLogs_invoiceLogID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."invoiceLogs" ALTER COLUMN "invoiceLogID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."invoiceLogs_invoiceLogID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 346 (class 1259 OID 35297)
-- Name: invoiceNotes; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."invoiceNotes" (
    "invoiceNoteID" integer NOT NULL,
    "invoiceID" integer NOT NULL,
    "time" timestamp without time zone NOT NULL,
    note text NOT NULL
);


ALTER TABLE bakery."invoiceNotes" OWNER TO postgres;

--
-- TOC entry 347 (class 1259 OID 35300)
-- Name: invoiceNotes_invoiceNoteID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."invoiceNotes" ALTER COLUMN "invoiceNoteID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."invoiceNotes_invoiceNoteID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 318 (class 1259 OID 34805)
-- Name: invoices; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery.invoices (
    "invoiceID" integer NOT NULL,
    "createdTime" timestamp without time zone NOT NULL,
    type public.invoicetype NOT NULL,
    status public.invoicestatus NOT NULL
);


ALTER TABLE bakery.invoices OWNER TO postgres;

--
-- TOC entry 319 (class 1259 OID 34808)
-- Name: invoices_invoiceID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery.invoices ALTER COLUMN "invoiceID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."invoices_invoiceID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 344 (class 1259 OID 35245)
-- Name: orderStockProducts; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."orderStockProducts" (
    "orderStockID" integer NOT NULL,
    "orderID" integer NOT NULL,
    "stockProductID" integer NOT NULL,
    "unitIncome" numeric NOT NULL,
    quantity smallint NOT NULL,
    status public.supplystatus NOT NULL
);


ALTER TABLE bakery."orderStockProducts" OWNER TO postgres;

--
-- TOC entry 345 (class 1259 OID 35248)
-- Name: orderStockProducts_orderStockID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."orderStockProducts" ALTER COLUMN "orderStockID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."orderStockProducts_orderStockID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 312 (class 1259 OID 34715)
-- Name: orderTags; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."orderTags" (
    "orderTagID" integer NOT NULL,
    "orderID" integer NOT NULL,
    "tagID" integer NOT NULL
);


ALTER TABLE bakery."orderTags" OWNER TO postgres;

--
-- TOC entry 313 (class 1259 OID 34718)
-- Name: orderTags_orderTagID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."orderTags" ALTER COLUMN "orderTagID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."orderTags_orderTagID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 316 (class 1259 OID 34753)
-- Name: orderTaskProducts; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."orderTaskProducts" (
    "orderTaskID" integer NOT NULL,
    "orderID" integer NOT NULL,
    "recipeID" integer,
    "productName" character varying NOT NULL,
    "unitIncome" numeric NOT NULL,
    quantity smallint NOT NULL,
    status public.taskstatus NOT NULL
);


ALTER TABLE bakery."orderTaskProducts" OWNER TO postgres;

--
-- TOC entry 317 (class 1259 OID 34756)
-- Name: orderTaskProducts_orderTaskID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."orderTaskProducts" ALTER COLUMN "orderTaskID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."orderTaskProducts_orderTaskID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 304 (class 1259 OID 34557)
-- Name: orders; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery.orders (
    "orderID" integer NOT NULL,
    "clientID" integer NOT NULL,
    "scheduledDeliveryTime" timestamp without time zone NOT NULL,
    "createdTime" timestamp without time zone NOT NULL,
    "fulfilledTime" timestamp without time zone,
    fufillment public.fulfillment_type NOT NULL,
    status public.orderstatus NOT NULL,
    "invoiceID" integer,
    name character varying NOT NULL,
    description text
);


ALTER TABLE bakery.orders OWNER TO postgres;

--
-- TOC entry 305 (class 1259 OID 34560)
-- Name: orders_orderID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery.orders ALTER COLUMN "orderID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."orders_orderID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 320 (class 1259 OID 34855)
-- Name: payments; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery.payments (
    "paymentID" integer NOT NULL,
    "receivedTime" timestamp without time zone NOT NULL,
    method public.paymentmethod NOT NULL,
    "invoiceID" integer
);


ALTER TABLE bakery.payments OWNER TO postgres;

--
-- TOC entry 321 (class 1259 OID 34858)
-- Name: payments_paymentID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery.payments ALTER COLUMN "paymentID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."payments_paymentID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 302 (class 1259 OID 34531)
-- Name: persons; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery.persons (
    "personID" integer NOT NULL,
    "nameFirst" character varying NOT NULL,
    "nameLast" character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    address1 character varying NOT NULL,
    address2 character varying,
    city character varying NOT NULL,
    state public.state NOT NULL,
    zip character varying NOT NULL
);


ALTER TABLE bakery.persons OWNER TO postgres;

--
-- TOC entry 303 (class 1259 OID 34534)
-- Name: persons_personID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery.persons ALTER COLUMN "personID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."persons_personID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 300 (class 1259 OID 34469)
-- Name: productStocks; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."productStocks" (
    "productStockID" integer NOT NULL,
    "stockProductID" integer NOT NULL,
    "producedDate" date NOT NULL,
    "daysRemaining" smallint,
    status public.expirationstatus NOT NULL
);


ALTER TABLE bakery."productStocks" OWNER TO postgres;

--
-- TOC entry 301 (class 1259 OID 34472)
-- Name: productStocks_productStockID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."productStocks" ALTER COLUMN "productStockID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."productStocks_productStockID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 324 (class 1259 OID 34917)
-- Name: recipeCategories; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."recipeCategories" (
    "recipeCategoryID" integer NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE bakery."recipeCategories" OWNER TO postgres;

--
-- TOC entry 325 (class 1259 OID 34920)
-- Name: recipeCategories_recipeCategoryID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."recipeCategories" ALTER COLUMN "recipeCategoryID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."recipeCategories_recipeCategoryID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 326 (class 1259 OID 34948)
-- Name: recipeComponents; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."recipeComponents" (
    "recipeComponentID" integer NOT NULL,
    "recipeID" integer NOT NULL,
    "componentID" integer NOT NULL,
    "componentAdvanceDays" smallint NOT NULL
);


ALTER TABLE bakery."recipeComponents" OWNER TO postgres;

--
-- TOC entry 327 (class 1259 OID 34951)
-- Name: recipeComponents_recipeComponentID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."recipeComponents" ALTER COLUMN "recipeComponentID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."recipeComponents_recipeComponentID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 340 (class 1259 OID 35160)
-- Name: recipeIngredients; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."recipeIngredients" (
    "recipeIngredientID" integer NOT NULL,
    "recipeID" integer NOT NULL,
    "ingredientID" integer NOT NULL,
    "measurementUnit" public.unit NOT NULL,
    measurement numeric NOT NULL
);


ALTER TABLE bakery."recipeIngredients" OWNER TO postgres;

--
-- TOC entry 341 (class 1259 OID 35163)
-- Name: recipeIngredients_recipeIngredientID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."recipeIngredients" ALTER COLUMN "recipeIngredientID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."recipeIngredients_recipeIngredientID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 330 (class 1259 OID 35026)
-- Name: recipeSteps; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."recipeSteps" (
    "recipeStepID" integer NOT NULL,
    "recipeID" integer NOT NULL,
    "stepID" integer NOT NULL,
    sequence smallint NOT NULL
);


ALTER TABLE bakery."recipeSteps" OWNER TO postgres;

--
-- TOC entry 331 (class 1259 OID 35029)
-- Name: recipeSteps_recipeStepID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."recipeSteps" ALTER COLUMN "recipeStepID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."recipeSteps_recipeStepID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 314 (class 1259 OID 34734)
-- Name: recipeTags; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."recipeTags" (
    "recipeTagID" integer NOT NULL,
    "recipeID" integer NOT NULL,
    "tagID" integer NOT NULL
);


ALTER TABLE bakery."recipeTags" OWNER TO postgres;

--
-- TOC entry 315 (class 1259 OID 34737)
-- Name: recipeTags_recipeTagID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."recipeTags" ALTER COLUMN "recipeTagID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."recipeTags_recipeTagID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 336 (class 1259 OID 35114)
-- Name: recipeTools; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."recipeTools" (
    "recipeToolID" integer NOT NULL,
    "recipeID" integer NOT NULL,
    "toolID" integer NOT NULL,
    quantity smallint NOT NULL
);


ALTER TABLE bakery."recipeTools" OWNER TO postgres;

--
-- TOC entry 337 (class 1259 OID 35117)
-- Name: recipeTools_recipeToolID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."recipeTools" ALTER COLUMN "recipeToolID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."recipeTools_recipeToolID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 308 (class 1259 OID 34635)
-- Name: recipes; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery.recipes (
    "recipeID" integer NOT NULL,
    title character varying NOT NULL,
    servings smallint NOT NULL,
    "categoryID" integer,
    "lifespanDays" smallint NOT NULL
);


ALTER TABLE bakery.recipes OWNER TO postgres;

--
-- TOC entry 309 (class 1259 OID 34638)
-- Name: recipes_recipeID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery.recipes ALTER COLUMN "recipeID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."recipes_recipeID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 328 (class 1259 OID 35015)
-- Name: steps; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery.steps (
    "stepID" integer NOT NULL,
    title character varying NOT NULL,
    description text NOT NULL
);


ALTER TABLE bakery.steps OWNER TO postgres;

--
-- TOC entry 329 (class 1259 OID 35018)
-- Name: steps_stepID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery.steps ALTER COLUMN "stepID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."steps_stepID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 298 (class 1259 OID 34443)
-- Name: stockProducts; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."stockProducts" (
    "stockProductID" integer NOT NULL,
    "productName" character varying NOT NULL,
    "recipeID" integer
);


ALTER TABLE bakery."stockProducts" OWNER TO postgres;

--
-- TOC entry 299 (class 1259 OID 34446)
-- Name: stockProducts_stockProductID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."stockProducts" ALTER COLUMN "stockProductID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."stockProducts_stockProductID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 310 (class 1259 OID 34703)
-- Name: tags; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery.tags (
    "tagID" integer NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE bakery.tags OWNER TO postgres;

--
-- TOC entry 311 (class 1259 OID 34706)
-- Name: tags_tagID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery.tags ALTER COLUMN "tagID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."tags_tagID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 334 (class 1259 OID 35093)
-- Name: toolStocks; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery."toolStocks" (
    "toolStockID" integer NOT NULL,
    "toolID" integer NOT NULL,
    quantity smallint NOT NULL,
    "purchasedBy" character varying NOT NULL,
    "purchaseDate" date NOT NULL
);


ALTER TABLE bakery."toolStocks" OWNER TO postgres;

--
-- TOC entry 335 (class 1259 OID 35096)
-- Name: toolStocks_toolStockID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery."toolStocks" ALTER COLUMN "toolStockID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."toolStocks_toolStockID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 332 (class 1259 OID 35082)
-- Name: tools; Type: TABLE; Schema: bakery; Owner: postgres
--

CREATE TABLE bakery.tools (
    "toolID" integer NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE bakery.tools OWNER TO postgres;

--
-- TOC entry 333 (class 1259 OID 35085)
-- Name: tools_toolID_seq; Type: SEQUENCE; Schema: bakery; Owner: postgres
--

ALTER TABLE bakery.tools ALTER COLUMN "toolID" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME bakery."tools_toolID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 267 (class 1259 OID 16540)
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[]
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- TOC entry 269 (class 1259 OID 16582)
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- TOC entry 268 (class 1259 OID 16555)
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- TOC entry 285 (class 1259 OID 16967)
-- Name: decrypted_secrets; Type: VIEW; Schema: vault; Owner: supabase_admin
--

CREATE VIEW vault.decrypted_secrets AS
 SELECT secrets.id,
    secrets.name,
    secrets.description,
    secrets.secret,
        CASE
            WHEN (secrets.secret IS NULL) THEN NULL::text
            ELSE
            CASE
                WHEN (secrets.key_id IS NULL) THEN NULL::text
                ELSE convert_from(pgsodium.crypto_aead_det_decrypt(decode(secrets.secret, 'base64'::text), convert_to(((((secrets.id)::text || secrets.description) || (secrets.created_at)::text) || (secrets.updated_at)::text), 'utf8'::name), secrets.key_id, secrets.nonce), 'utf8'::name)
            END
        END AS decrypted_secret,
    secrets.key_id,
    secrets.nonce,
    secrets.created_at,
    secrets.updated_at
   FROM vault.secrets;


ALTER TABLE vault.decrypted_secrets OWNER TO supabase_admin;

--
-- TOC entry 3791 (class 2604 OID 16504)
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- TOC entry 4160 (class 0 OID 16519)
-- Dependencies: 265
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
00000000-0000-0000-0000-000000000000	936c87cc-3f60-41d7-a1de-51c42e786610	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"joshmerrell.us@gmail.com","user_id":"bac9aada-b5d2-4697-ab72-83b91cda2db5","user_phone":""}}	2023-05-18 06:01:34.082246+00	
\.


--
-- TOC entry 4174 (class 0 OID 28551)
-- Dependencies: 295
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method) FROM stdin;
\.


--
-- TOC entry 4165 (class 0 OID 28348)
-- Dependencies: 286
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) FROM stdin;
bac9aada-b5d2-4697-ab72-83b91cda2db5	bac9aada-b5d2-4697-ab72-83b91cda2db5	{"sub": "bac9aada-b5d2-4697-ab72-83b91cda2db5", "email": "joshmerrell.us@gmail.com"}	email	2023-05-18 06:01:34.0805+00	2023-05-18 06:01:34.080547+00	2023-05-18 06:01:34.080547+00
\.


--
-- TOC entry 4159 (class 0 OID 16512)
-- Dependencies: 264
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4169 (class 0 OID 28438)
-- Dependencies: 290
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- TOC entry 4168 (class 0 OID 28426)
-- Dependencies: 289
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address) FROM stdin;
\.


--
-- TOC entry 4167 (class 0 OID 28413)
-- Dependencies: 288
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret) FROM stdin;
\.


--
-- TOC entry 4158 (class 0 OID 16501)
-- Dependencies: 263
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- TOC entry 4172 (class 0 OID 28480)
-- Dependencies: 293
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4173 (class 0 OID 28498)
-- Dependencies: 294
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, from_ip_address, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4161 (class 0 OID 16527)
-- Dependencies: 266
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
\.


--
-- TOC entry 4166 (class 0 OID 28378)
-- Dependencies: 287
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after) FROM stdin;
\.


--
-- TOC entry 4171 (class 0 OID 28465)
-- Dependencies: 292
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4170 (class 0 OID 28456)
-- Dependencies: 291
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4156 (class 0 OID 16489)
-- Dependencies: 261
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at) FROM stdin;
00000000-0000-0000-0000-000000000000	bac9aada-b5d2-4697-ab72-83b91cda2db5	authenticated	authenticated	joshmerrell.us@gmail.com	$2a$10$yL3ZhXOmv9gIeqKvv0WBn.4XXmHdZZEA2CwG7iMa4v314TqD0Ks26	2023-05-18 06:01:34.086222+00	\N		\N		\N			\N	\N	{"provider": "email", "providers": ["email"]}	{}	\N	2023-05-18 06:01:34.073286+00	2023-05-18 06:01:34.08761+00	\N	\N			\N		0	\N		\N	f	\N
\.


--
-- TOC entry 4185 (class 0 OID 34568)
-- Dependencies: 306
-- Data for Name: clients; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery.clients ("clientID", "personID", "createdTime") FROM stdin;
\.


--
-- TOC entry 4175 (class 0 OID 34417)
-- Dependencies: 296
-- Data for Name: expenses; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery.expenses ("expenseID", "createdTime", "transactionDate", name, description, amount, supplier, method, "receiptID", purchaser, category) FROM stdin;
\.


--
-- TOC entry 4221 (class 0 OID 35181)
-- Dependencies: 342
-- Data for Name: ingredientStockID; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."ingredientStockID" ("ingredientStockID", "ingredientID", "measurementUnit", measurement, "purchasedBy", "purchasedDate") FROM stdin;
\.


--
-- TOC entry 4217 (class 0 OID 35149)
-- Dependencies: 338
-- Data for Name: ingredients; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery.ingredients ("ingredientID", name, "ifespanDays") FROM stdin;
\.


--
-- TOC entry 4201 (class 0 OID 34869)
-- Dependencies: 322
-- Data for Name: invoiceLogs; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."invoiceLogs" ("invoiceLogID", "invoiceID", type, log, "createdTime") FROM stdin;
\.


--
-- TOC entry 4225 (class 0 OID 35297)
-- Dependencies: 346
-- Data for Name: invoiceNotes; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."invoiceNotes" ("invoiceNoteID", "invoiceID", "time", note) FROM stdin;
\.


--
-- TOC entry 4197 (class 0 OID 34805)
-- Dependencies: 318
-- Data for Name: invoices; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery.invoices ("invoiceID", "createdTime", type, status) FROM stdin;
\.


--
-- TOC entry 4223 (class 0 OID 35245)
-- Dependencies: 344
-- Data for Name: orderStockProducts; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."orderStockProducts" ("orderStockID", "orderID", "stockProductID", "unitIncome", quantity, status) FROM stdin;
\.


--
-- TOC entry 4191 (class 0 OID 34715)
-- Dependencies: 312
-- Data for Name: orderTags; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."orderTags" ("orderTagID", "orderID", "tagID") FROM stdin;
\.


--
-- TOC entry 4195 (class 0 OID 34753)
-- Dependencies: 316
-- Data for Name: orderTaskProducts; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."orderTaskProducts" ("orderTaskID", "orderID", "recipeID", "productName", "unitIncome", quantity, status) FROM stdin;
\.


--
-- TOC entry 4183 (class 0 OID 34557)
-- Dependencies: 304
-- Data for Name: orders; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery.orders ("orderID", "clientID", "scheduledDeliveryTime", "createdTime", "fulfilledTime", fufillment, status, "invoiceID", name, description) FROM stdin;
\.


--
-- TOC entry 4199 (class 0 OID 34855)
-- Dependencies: 320
-- Data for Name: payments; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery.payments ("paymentID", "receivedTime", method, "invoiceID") FROM stdin;
\.


--
-- TOC entry 4181 (class 0 OID 34531)
-- Dependencies: 302
-- Data for Name: persons; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery.persons ("personID", "nameFirst", "nameLast", email, phone, address1, address2, city, state, zip) FROM stdin;
\.


--
-- TOC entry 4179 (class 0 OID 34469)
-- Dependencies: 300
-- Data for Name: productStocks; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."productStocks" ("productStockID", "stockProductID", "producedDate", "daysRemaining", status) FROM stdin;
\.


--
-- TOC entry 4203 (class 0 OID 34917)
-- Dependencies: 324
-- Data for Name: recipeCategories; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."recipeCategories" ("recipeCategoryID", name) FROM stdin;
\.


--
-- TOC entry 4205 (class 0 OID 34948)
-- Dependencies: 326
-- Data for Name: recipeComponents; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."recipeComponents" ("recipeComponentID", "recipeID", "componentID", "componentAdvanceDays") FROM stdin;
\.


--
-- TOC entry 4219 (class 0 OID 35160)
-- Dependencies: 340
-- Data for Name: recipeIngredients; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."recipeIngredients" ("recipeIngredientID", "recipeID", "ingredientID", "measurementUnit", measurement) FROM stdin;
\.


--
-- TOC entry 4209 (class 0 OID 35026)
-- Dependencies: 330
-- Data for Name: recipeSteps; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."recipeSteps" ("recipeStepID", "recipeID", "stepID", sequence) FROM stdin;
\.


--
-- TOC entry 4193 (class 0 OID 34734)
-- Dependencies: 314
-- Data for Name: recipeTags; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."recipeTags" ("recipeTagID", "recipeID", "tagID") FROM stdin;
\.


--
-- TOC entry 4215 (class 0 OID 35114)
-- Dependencies: 336
-- Data for Name: recipeTools; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."recipeTools" ("recipeToolID", "recipeID", "toolID", quantity) FROM stdin;
\.


--
-- TOC entry 4187 (class 0 OID 34635)
-- Dependencies: 308
-- Data for Name: recipes; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery.recipes ("recipeID", title, servings, "categoryID", "lifespanDays") FROM stdin;
\.


--
-- TOC entry 4207 (class 0 OID 35015)
-- Dependencies: 328
-- Data for Name: steps; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery.steps ("stepID", title, description) FROM stdin;
\.


--
-- TOC entry 4177 (class 0 OID 34443)
-- Dependencies: 298
-- Data for Name: stockProducts; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."stockProducts" ("stockProductID", "productName", "recipeID") FROM stdin;
\.


--
-- TOC entry 4189 (class 0 OID 34703)
-- Dependencies: 310
-- Data for Name: tags; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery.tags ("tagID", name) FROM stdin;
\.


--
-- TOC entry 4213 (class 0 OID 35093)
-- Dependencies: 334
-- Data for Name: toolStocks; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery."toolStocks" ("toolStockID", "toolID", quantity, "purchasedBy", "purchaseDate") FROM stdin;
\.


--
-- TOC entry 4211 (class 0 OID 35082)
-- Dependencies: 332
-- Data for Name: tools; Type: TABLE DATA; Schema: bakery; Owner: postgres
--

COPY bakery.tools ("toolID", name) FROM stdin;
\.


--
-- TOC entry 3780 (class 0 OID 16788)
-- Dependencies: 278
-- Data for Name: key; Type: TABLE DATA; Schema: pgsodium; Owner: supabase_admin
--

COPY pgsodium.key (id, status, created, expires, key_type, key_id, key_context, name, associated_data, raw_key, raw_key_nonce, parent_key, comment, user_data) FROM stdin;
\.


--
-- TOC entry 4162 (class 0 OID 16540)
-- Dependencies: 267
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types) FROM stdin;
\.


--
-- TOC entry 4164 (class 0 OID 16582)
-- Dependencies: 269
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2023-05-13 06:31:07.637365
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2023-05-13 06:31:07.642966
2	pathtoken-column	49756be03be4c17bb85fe70d4a861f27de7e49ad	2023-05-13 06:31:07.64753
3	add-migrations-rls	bb5d124c53d68635a883e399426c6a5a25fc893d	2023-05-13 06:31:07.671741
4	add-size-functions	6d79007d04f5acd288c9c250c42d2d5fd286c54d	2023-05-13 06:31:07.681167
5	change-column-name-in-get-size	fd65688505d2ffa9fbdc58a944348dd8604d688c	2023-05-13 06:31:07.686857
6	add-rls-to-buckets	63e2bab75a2040fee8e3fb3f15a0d26f3380e9b6	2023-05-13 06:31:07.693601
7	add-public-to-buckets	82568934f8a4d9e0a85f126f6fb483ad8214c418	2023-05-13 06:31:07.698911
8	fix-search-function	1a43a40eddb525f2e2f26efd709e6c06e58e059c	2023-05-13 06:31:07.705215
9	search-files-search-function	34c096597eb8b9d077fdfdde9878c88501b2fafc	2023-05-13 06:31:07.710862
10	add-trigger-to-auto-update-updated_at-column	37d6bb964a70a822e6d37f22f457b9bca7885928	2023-05-13 06:31:07.717372
11	add-automatic-avif-detection-flag	bd76c53a9c564c80d98d119c1b3a28e16c8152db	2023-05-13 06:31:07.722985
12	add-bucket-custom-limits	cbe0a4c32a0e891554a21020433b7a4423c07ee7	2023-05-13 06:31:07.728228
13	use-bytes-for-max-size	7a158ebce8a0c2801c9c65b7e9b2f98f68b3874e	2023-05-13 06:31:07.733836
14	add-can-insert-object-function	273193826bca7e0990b458d1ba72f8aa27c0d825	2023-05-13 06:31:07.749705
15	add-version	e821a779d26612899b8c2dfe20245f904a327c4f	2023-05-13 06:31:07.755013
\.


--
-- TOC entry 4163 (class 0 OID 16555)
-- Dependencies: 268
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version) FROM stdin;
\.


--
-- TOC entry 3782 (class 0 OID 16948)
-- Dependencies: 284
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4375 (class 0 OID 0)
-- Dependencies: 262
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- TOC entry 4376 (class 0 OID 0)
-- Dependencies: 307
-- Name: clients_clientID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."clients_clientID_seq"', 1, false);


--
-- TOC entry 4377 (class 0 OID 0)
-- Dependencies: 297
-- Name: expenses_expenseID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."expenses_expenseID_seq"', 1, false);


--
-- TOC entry 4378 (class 0 OID 0)
-- Dependencies: 343
-- Name: ingredientStockID_ingredientStockID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."ingredientStockID_ingredientStockID_seq"', 1, false);


--
-- TOC entry 4379 (class 0 OID 0)
-- Dependencies: 339
-- Name: ingredients_ingredientID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."ingredients_ingredientID_seq"', 1, false);


--
-- TOC entry 4380 (class 0 OID 0)
-- Dependencies: 323
-- Name: invoiceLogs_invoiceLogID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."invoiceLogs_invoiceLogID_seq"', 1, false);


--
-- TOC entry 4381 (class 0 OID 0)
-- Dependencies: 347
-- Name: invoiceNotes_invoiceNoteID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."invoiceNotes_invoiceNoteID_seq"', 1, false);


--
-- TOC entry 4382 (class 0 OID 0)
-- Dependencies: 319
-- Name: invoices_invoiceID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."invoices_invoiceID_seq"', 1, false);


--
-- TOC entry 4383 (class 0 OID 0)
-- Dependencies: 345
-- Name: orderStockProducts_orderStockID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."orderStockProducts_orderStockID_seq"', 1, false);


--
-- TOC entry 4384 (class 0 OID 0)
-- Dependencies: 313
-- Name: orderTags_orderTagID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."orderTags_orderTagID_seq"', 1, false);


--
-- TOC entry 4385 (class 0 OID 0)
-- Dependencies: 317
-- Name: orderTaskProducts_orderTaskID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."orderTaskProducts_orderTaskID_seq"', 1, false);


--
-- TOC entry 4386 (class 0 OID 0)
-- Dependencies: 305
-- Name: orders_orderID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."orders_orderID_seq"', 1, false);


--
-- TOC entry 4387 (class 0 OID 0)
-- Dependencies: 321
-- Name: payments_paymentID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."payments_paymentID_seq"', 1, false);


--
-- TOC entry 4388 (class 0 OID 0)
-- Dependencies: 303
-- Name: persons_personID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."persons_personID_seq"', 1, false);


--
-- TOC entry 4389 (class 0 OID 0)
-- Dependencies: 301
-- Name: productStocks_productStockID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."productStocks_productStockID_seq"', 1, false);


--
-- TOC entry 4390 (class 0 OID 0)
-- Dependencies: 325
-- Name: recipeCategories_recipeCategoryID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."recipeCategories_recipeCategoryID_seq"', 1, false);


--
-- TOC entry 4391 (class 0 OID 0)
-- Dependencies: 327
-- Name: recipeComponents_recipeComponentID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."recipeComponents_recipeComponentID_seq"', 1, false);


--
-- TOC entry 4392 (class 0 OID 0)
-- Dependencies: 341
-- Name: recipeIngredients_recipeIngredientID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."recipeIngredients_recipeIngredientID_seq"', 1, false);


--
-- TOC entry 4393 (class 0 OID 0)
-- Dependencies: 331
-- Name: recipeSteps_recipeStepID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."recipeSteps_recipeStepID_seq"', 1, false);


--
-- TOC entry 4394 (class 0 OID 0)
-- Dependencies: 315
-- Name: recipeTags_recipeTagID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."recipeTags_recipeTagID_seq"', 1, false);


--
-- TOC entry 4395 (class 0 OID 0)
-- Dependencies: 337
-- Name: recipeTools_recipeToolID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."recipeTools_recipeToolID_seq"', 1, false);


--
-- TOC entry 4396 (class 0 OID 0)
-- Dependencies: 309
-- Name: recipes_recipeID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."recipes_recipeID_seq"', 1, false);


--
-- TOC entry 4397 (class 0 OID 0)
-- Dependencies: 329
-- Name: steps_stepID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."steps_stepID_seq"', 1, false);


--
-- TOC entry 4398 (class 0 OID 0)
-- Dependencies: 299
-- Name: stockProducts_stockProductID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."stockProducts_stockProductID_seq"', 1, false);


--
-- TOC entry 4399 (class 0 OID 0)
-- Dependencies: 311
-- Name: tags_tagID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."tags_tagID_seq"', 1, false);


--
-- TOC entry 4400 (class 0 OID 0)
-- Dependencies: 335
-- Name: toolStocks_toolStockID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."toolStocks_toolStockID_seq"', 1, false);


--
-- TOC entry 4401 (class 0 OID 0)
-- Dependencies: 333
-- Name: tools_toolID_seq; Type: SEQUENCE SET; Schema: bakery; Owner: postgres
--

SELECT pg_catalog.setval('bakery."tools_toolID_seq"', 1, false);


--
-- TOC entry 4402 (class 0 OID 0)
-- Dependencies: 277
-- Name: key_key_id_seq; Type: SEQUENCE SET; Schema: pgsodium; Owner: supabase_admin
--

SELECT pg_catalog.setval('pgsodium.key_key_id_seq', 1, false);


--
-- TOC entry 3888 (class 2606 OID 28451)
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- TOC entry 3848 (class 2606 OID 16525)
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 3908 (class 2606 OID 28557)
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- TOC entry 3875 (class 2606 OID 28354)
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (provider, id);


--
-- TOC entry 3846 (class 2606 OID 16518)
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- TOC entry 3890 (class 2606 OID 28444)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- TOC entry 3886 (class 2606 OID 28432)
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- TOC entry 3883 (class 2606 OID 28419)
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- TOC entry 3841 (class 2606 OID 16508)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3844 (class 2606 OID 28361)
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- TOC entry 3899 (class 2606 OID 28491)
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- TOC entry 3901 (class 2606 OID 28489)
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 3905 (class 2606 OID 28505)
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- TOC entry 3851 (class 2606 OID 16531)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 3878 (class 2606 OID 28382)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 3896 (class 2606 OID 28472)
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- TOC entry 3892 (class 2606 OID 28463)
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 3834 (class 2606 OID 28545)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 3836 (class 2606 OID 16495)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3922 (class 2606 OID 34576)
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY ("clientID");


--
-- TOC entry 3912 (class 2606 OID 34427)
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY ("expenseID");


--
-- TOC entry 3958 (class 2606 OID 35191)
-- Name: ingredientStockID ingredientStockID_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."ingredientStockID"
    ADD CONSTRAINT "ingredientStockID_pkey" PRIMARY KEY ("ingredientStockID");


--
-- TOC entry 3954 (class 2606 OID 35159)
-- Name: ingredients ingredients_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.ingredients
    ADD CONSTRAINT ingredients_pkey PRIMARY KEY ("ingredientID");


--
-- TOC entry 3938 (class 2606 OID 34879)
-- Name: invoiceLogs invoiceLogs_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."invoiceLogs"
    ADD CONSTRAINT "invoiceLogs_pkey" PRIMARY KEY ("invoiceLogID");


--
-- TOC entry 3962 (class 2606 OID 35307)
-- Name: invoiceNotes invoiceNotes_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."invoiceNotes"
    ADD CONSTRAINT "invoiceNotes_pkey" PRIMARY KEY ("invoiceNoteID");


--
-- TOC entry 3934 (class 2606 OID 34813)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY ("invoiceID");


--
-- TOC entry 3960 (class 2606 OID 35255)
-- Name: orderStockProducts orderStockProducts_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."orderStockProducts"
    ADD CONSTRAINT "orderStockProducts_pkey" PRIMARY KEY ("orderStockID");


--
-- TOC entry 3928 (class 2606 OID 34723)
-- Name: orderTags orderTags_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."orderTags"
    ADD CONSTRAINT "orderTags_pkey" PRIMARY KEY ("orderTagID");


--
-- TOC entry 3932 (class 2606 OID 34763)
-- Name: orderTaskProducts orderTaskProducts_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."orderTaskProducts"
    ADD CONSTRAINT "orderTaskProducts_pkey" PRIMARY KEY ("orderTaskID");


--
-- TOC entry 3920 (class 2606 OID 34567)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY ("orderID");


--
-- TOC entry 3936 (class 2606 OID 34863)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY ("paymentID");


--
-- TOC entry 3918 (class 2606 OID 34541)
-- Name: persons persons_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.persons
    ADD CONSTRAINT persons_pkey PRIMARY KEY ("personID");


--
-- TOC entry 3916 (class 2606 OID 34477)
-- Name: productStocks productStocks_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."productStocks"
    ADD CONSTRAINT "productStocks_pkey" PRIMARY KEY ("productStockID");


--
-- TOC entry 3940 (class 2606 OID 34927)
-- Name: recipeCategories recipeCategories_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeCategories"
    ADD CONSTRAINT "recipeCategories_pkey" PRIMARY KEY ("recipeCategoryID");


--
-- TOC entry 3942 (class 2606 OID 34956)
-- Name: recipeComponents recipeComponents_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeComponents"
    ADD CONSTRAINT "recipeComponents_pkey" PRIMARY KEY ("recipeComponentID");


--
-- TOC entry 3956 (class 2606 OID 35170)
-- Name: recipeIngredients recipeIngredients_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeIngredients"
    ADD CONSTRAINT "recipeIngredients_pkey" PRIMARY KEY ("recipeIngredientID");


--
-- TOC entry 3946 (class 2606 OID 35034)
-- Name: recipeSteps recipeSteps_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeSteps"
    ADD CONSTRAINT "recipeSteps_pkey" PRIMARY KEY ("recipeStepID");


--
-- TOC entry 3930 (class 2606 OID 34742)
-- Name: recipeTags recipeTags_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeTags"
    ADD CONSTRAINT "recipeTags_pkey" PRIMARY KEY ("recipeTagID");


--
-- TOC entry 3952 (class 2606 OID 35122)
-- Name: recipeTools recipeTools_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeTools"
    ADD CONSTRAINT "recipeTools_pkey" PRIMARY KEY ("recipeToolID");


--
-- TOC entry 3924 (class 2606 OID 34645)
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY ("recipeID");


--
-- TOC entry 3944 (class 2606 OID 35025)
-- Name: steps steps_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.steps
    ADD CONSTRAINT steps_pkey PRIMARY KEY ("stepID");


--
-- TOC entry 3914 (class 2606 OID 34453)
-- Name: stockProducts stockProducts_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."stockProducts"
    ADD CONSTRAINT "stockProducts_pkey" PRIMARY KEY ("stockProductID");


--
-- TOC entry 3926 (class 2606 OID 34713)
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY ("tagID");


--
-- TOC entry 3950 (class 2606 OID 35101)
-- Name: toolStocks toolStocks_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."toolStocks"
    ADD CONSTRAINT "toolStocks_pkey" PRIMARY KEY ("toolStockID");


--
-- TOC entry 3948 (class 2606 OID 35092)
-- Name: tools tools_pkey; Type: CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.tools
    ADD CONSTRAINT tools_pkey PRIMARY KEY ("toolID");


--
-- TOC entry 3854 (class 2606 OID 16548)
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- TOC entry 3860 (class 2606 OID 16589)
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- TOC entry 3862 (class 2606 OID 16587)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3858 (class 2606 OID 16565)
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- TOC entry 3849 (class 1259 OID 16526)
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- TOC entry 3825 (class 1259 OID 28371)
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3826 (class 1259 OID 28373)
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3827 (class 1259 OID 28374)
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3881 (class 1259 OID 28453)
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- TOC entry 3873 (class 1259 OID 28541)
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- TOC entry 4403 (class 0 OID 0)
-- Dependencies: 3873
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- TOC entry 3876 (class 1259 OID 28368)
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- TOC entry 3909 (class 1259 OID 28558)
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- TOC entry 3910 (class 1259 OID 28559)
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- TOC entry 3884 (class 1259 OID 28425)
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- TOC entry 3828 (class 1259 OID 28375)
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3829 (class 1259 OID 28372)
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3837 (class 1259 OID 16509)
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- TOC entry 3838 (class 1259 OID 16510)
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- TOC entry 3839 (class 1259 OID 28367)
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- TOC entry 3842 (class 1259 OID 28455)
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- TOC entry 3902 (class 1259 OID 28497)
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- TOC entry 3903 (class 1259 OID 28512)
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- TOC entry 3906 (class 1259 OID 28511)
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- TOC entry 3879 (class 1259 OID 28454)
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- TOC entry 3894 (class 1259 OID 28479)
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- TOC entry 3897 (class 1259 OID 28478)
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- TOC entry 3893 (class 1259 OID 28464)
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- TOC entry 3880 (class 1259 OID 28452)
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- TOC entry 3830 (class 1259 OID 28532)
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- TOC entry 4404 (class 0 OID 0)
-- Dependencies: 3830
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- TOC entry 3831 (class 1259 OID 28369)
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- TOC entry 3832 (class 1259 OID 16499)
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- TOC entry 3852 (class 1259 OID 16554)
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- TOC entry 3855 (class 1259 OID 16576)
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- TOC entry 3856 (class 1259 OID 16577)
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- TOC entry 4002 (class 2620 OID 28574)
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- TOC entry 3967 (class 2606 OID 28355)
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 3971 (class 2606 OID 28445)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 3970 (class 2606 OID 28433)
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- TOC entry 3969 (class 2606 OID 28420)
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 3963 (class 2606 OID 28388)
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 3973 (class 2606 OID 28492)
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 3974 (class 2606 OID 28506)
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 3968 (class 2606 OID 28383)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 3972 (class 2606 OID 28473)
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 3979 (class 2606 OID 34577)
-- Name: clients clients_personID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.clients
    ADD CONSTRAINT "clients_personID_fkey" FOREIGN KEY ("personID") REFERENCES bakery.persons("personID") ON DELETE CASCADE;


--
-- TOC entry 3998 (class 2606 OID 35192)
-- Name: ingredientStockID ingredientStockID_ingredientID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."ingredientStockID"
    ADD CONSTRAINT "ingredientStockID_ingredientID_fkey" FOREIGN KEY ("ingredientID") REFERENCES bakery.ingredients("ingredientID") ON DELETE CASCADE;


--
-- TOC entry 3988 (class 2606 OID 34880)
-- Name: invoiceLogs invoiceLogs_invoiceID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."invoiceLogs"
    ADD CONSTRAINT "invoiceLogs_invoiceID_fkey" FOREIGN KEY ("invoiceID") REFERENCES bakery.invoices("invoiceID") ON DELETE SET NULL;


--
-- TOC entry 4001 (class 2606 OID 35308)
-- Name: invoiceNotes invoiceNotes_invoiceID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."invoiceNotes"
    ADD CONSTRAINT "invoiceNotes_invoiceID_fkey" FOREIGN KEY ("invoiceID") REFERENCES bakery.invoices("invoiceID") ON DELETE CASCADE;


--
-- TOC entry 3999 (class 2606 OID 35256)
-- Name: orderStockProducts orderStockProducts_orderID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."orderStockProducts"
    ADD CONSTRAINT "orderStockProducts_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES bakery.orders("orderID") ON DELETE CASCADE;


--
-- TOC entry 4000 (class 2606 OID 35261)
-- Name: orderStockProducts orderStockProducts_stockProductID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."orderStockProducts"
    ADD CONSTRAINT "orderStockProducts_stockProductID_fkey" FOREIGN KEY ("stockProductID") REFERENCES bakery."stockProducts"("stockProductID") ON DELETE CASCADE;


--
-- TOC entry 3981 (class 2606 OID 34724)
-- Name: orderTags orderTags_orderID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."orderTags"
    ADD CONSTRAINT "orderTags_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES bakery.orders("orderID") ON DELETE CASCADE;


--
-- TOC entry 3982 (class 2606 OID 34729)
-- Name: orderTags orderTags_tagID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."orderTags"
    ADD CONSTRAINT "orderTags_tagID_fkey" FOREIGN KEY ("tagID") REFERENCES bakery.tags("tagID") ON DELETE CASCADE;


--
-- TOC entry 3985 (class 2606 OID 34764)
-- Name: orderTaskProducts orderTaskProducts_orderID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."orderTaskProducts"
    ADD CONSTRAINT "orderTaskProducts_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES bakery.orders("orderID") ON DELETE CASCADE;


--
-- TOC entry 3986 (class 2606 OID 34769)
-- Name: orderTaskProducts orderTaskProducts_recipeID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."orderTaskProducts"
    ADD CONSTRAINT "orderTaskProducts_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES bakery.recipes("recipeID") ON DELETE SET NULL;


--
-- TOC entry 3977 (class 2606 OID 34814)
-- Name: orders orders_clientID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.orders
    ADD CONSTRAINT "orders_clientID_fkey" FOREIGN KEY ("clientID") REFERENCES bakery.clients("clientID") ON DELETE CASCADE;


--
-- TOC entry 3978 (class 2606 OID 34819)
-- Name: orders orders_invoiceID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.orders
    ADD CONSTRAINT "orders_invoiceID_fkey" FOREIGN KEY ("invoiceID") REFERENCES bakery.invoices("invoiceID") ON DELETE SET NULL;


--
-- TOC entry 3987 (class 2606 OID 34864)
-- Name: payments payments_invoiceID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.payments
    ADD CONSTRAINT "payments_invoiceID_fkey" FOREIGN KEY ("invoiceID") REFERENCES bakery.invoices("invoiceID") ON DELETE SET NULL;


--
-- TOC entry 3976 (class 2606 OID 34478)
-- Name: productStocks productStocks_stockProductID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."productStocks"
    ADD CONSTRAINT "productStocks_stockProductID_fkey" FOREIGN KEY ("stockProductID") REFERENCES bakery."stockProducts"("stockProductID") ON DELETE CASCADE;


--
-- TOC entry 3989 (class 2606 OID 34962)
-- Name: recipeComponents recipeComponents_componentID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeComponents"
    ADD CONSTRAINT "recipeComponents_componentID_fkey" FOREIGN KEY ("componentID") REFERENCES bakery.recipes("recipeID") ON DELETE SET NULL;


--
-- TOC entry 3990 (class 2606 OID 34957)
-- Name: recipeComponents recipeComponents_recipeID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeComponents"
    ADD CONSTRAINT "recipeComponents_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES bakery.recipes("recipeID") ON DELETE SET NULL;


--
-- TOC entry 3996 (class 2606 OID 35176)
-- Name: recipeIngredients recipeIngredients_ingredientID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeIngredients"
    ADD CONSTRAINT "recipeIngredients_ingredientID_fkey" FOREIGN KEY ("ingredientID") REFERENCES bakery.ingredients("ingredientID") ON DELETE CASCADE;


--
-- TOC entry 3997 (class 2606 OID 35171)
-- Name: recipeIngredients recipeIngredients_recipeID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeIngredients"
    ADD CONSTRAINT "recipeIngredients_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES bakery.recipes("recipeID") ON DELETE CASCADE;


--
-- TOC entry 3991 (class 2606 OID 35055)
-- Name: recipeSteps recipeSteps_recipeID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeSteps"
    ADD CONSTRAINT "recipeSteps_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES bakery.recipes("recipeID") ON DELETE CASCADE;


--
-- TOC entry 3992 (class 2606 OID 35060)
-- Name: recipeSteps recipeSteps_stepID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeSteps"
    ADD CONSTRAINT "recipeSteps_stepID_fkey" FOREIGN KEY ("stepID") REFERENCES bakery.steps("stepID") ON DELETE CASCADE;


--
-- TOC entry 3983 (class 2606 OID 34743)
-- Name: recipeTags recipeTags_recipeID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeTags"
    ADD CONSTRAINT "recipeTags_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES bakery.recipes("recipeID") ON DELETE CASCADE;


--
-- TOC entry 3984 (class 2606 OID 34748)
-- Name: recipeTags recipeTags_tagID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeTags"
    ADD CONSTRAINT "recipeTags_tagID_fkey" FOREIGN KEY ("tagID") REFERENCES bakery.tags("tagID") ON DELETE CASCADE;


--
-- TOC entry 3994 (class 2606 OID 35123)
-- Name: recipeTools recipeTools_recipeID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeTools"
    ADD CONSTRAINT "recipeTools_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES bakery.recipes("recipeID") ON DELETE CASCADE;


--
-- TOC entry 3995 (class 2606 OID 35128)
-- Name: recipeTools recipeTools_toolID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."recipeTools"
    ADD CONSTRAINT "recipeTools_toolID_fkey" FOREIGN KEY ("toolID") REFERENCES bakery.tools("toolID") ON DELETE CASCADE;


--
-- TOC entry 3980 (class 2606 OID 34943)
-- Name: recipes recipes_categoryID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery.recipes
    ADD CONSTRAINT "recipes_categoryID_fkey" FOREIGN KEY ("categoryID") REFERENCES bakery."recipeCategories"("recipeCategoryID") ON DELETE SET NULL;


--
-- TOC entry 3975 (class 2606 OID 34666)
-- Name: stockProducts stockProducts_recipeID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."stockProducts"
    ADD CONSTRAINT "stockProducts_recipeID_fkey" FOREIGN KEY ("recipeID") REFERENCES bakery.recipes("recipeID") ON DELETE SET NULL;


--
-- TOC entry 3993 (class 2606 OID 35107)
-- Name: toolStocks toolStocks_toolID_fkey; Type: FK CONSTRAINT; Schema: bakery; Owner: postgres
--

ALTER TABLE ONLY bakery."toolStocks"
    ADD CONSTRAINT "toolStocks_toolID_fkey" FOREIGN KEY ("toolID") REFERENCES bakery.tools("toolID") ON DELETE CASCADE;


--
-- TOC entry 3964 (class 2606 OID 16549)
-- Name: buckets buckets_owner_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_owner_fkey FOREIGN KEY (owner) REFERENCES auth.users(id);


--
-- TOC entry 3965 (class 2606 OID 16566)
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 3966 (class 2606 OID 16571)
-- Name: objects objects_owner_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_owner_fkey FOREIGN KEY (owner) REFERENCES auth.users(id);


--
-- TOC entry 4152 (class 0 OID 16540)
-- Dependencies: 267
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4154 (class 0 OID 16582)
-- Dependencies: 269
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4153 (class 0 OID 16555)
-- Dependencies: 268
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4155 (class 6104 OID 16419)
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- TOC entry 4232 (class 0 OID 0)
-- Dependencies: 21
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT ALL ON SCHEMA auth TO postgres;


--
-- TOC entry 4233 (class 0 OID 0)
-- Dependencies: 40
-- Name: SCHEMA bakery; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA bakery TO anon;
GRANT USAGE ON SCHEMA bakery TO authenticated;
GRANT USAGE ON SCHEMA bakery TO service_role;
GRANT USAGE ON SCHEMA bakery TO dashboard_user;


--
-- TOC entry 4234 (class 0 OID 0)
-- Dependencies: 19
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- TOC entry 4235 (class 0 OID 0)
-- Dependencies: 23
-- Name: SCHEMA graphql_public; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA graphql_public TO postgres;
GRANT USAGE ON SCHEMA graphql_public TO anon;
GRANT USAGE ON SCHEMA graphql_public TO authenticated;
GRANT USAGE ON SCHEMA graphql_public TO service_role;


--
-- TOC entry 4237 (class 0 OID 0)
-- Dependencies: 15
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- TOC entry 4238 (class 0 OID 0)
-- Dependencies: 22
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;


--
-- TOC entry 4239 (class 0 OID 0)
-- Dependencies: 20
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT ALL ON SCHEMA storage TO postgres;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- TOC entry 4247 (class 0 OID 0)
-- Dependencies: 371
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- TOC entry 4248 (class 0 OID 0)
-- Dependencies: 571
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- TOC entry 4250 (class 0 OID 0)
-- Dependencies: 370
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- TOC entry 4252 (class 0 OID 0)
-- Dependencies: 366
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- TOC entry 4253 (class 0 OID 0)
-- Dependencies: 568
-- Name: FUNCTION algorithm_sign(signables text, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.algorithm_sign(signables text, secret text, algorithm text) FROM postgres;
GRANT ALL ON FUNCTION extensions.algorithm_sign(signables text, secret text, algorithm text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.algorithm_sign(signables text, secret text, algorithm text) TO dashboard_user;


--
-- TOC entry 4254 (class 0 OID 0)
-- Dependencies: 562
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- TOC entry 4255 (class 0 OID 0)
-- Dependencies: 563
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- TOC entry 4256 (class 0 OID 0)
-- Dependencies: 542
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- TOC entry 4257 (class 0 OID 0)
-- Dependencies: 564
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- TOC entry 4258 (class 0 OID 0)
-- Dependencies: 546
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4259 (class 0 OID 0)
-- Dependencies: 548
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4260 (class 0 OID 0)
-- Dependencies: 539
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- TOC entry 4261 (class 0 OID 0)
-- Dependencies: 538
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- TOC entry 4262 (class 0 OID 0)
-- Dependencies: 545
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4263 (class 0 OID 0)
-- Dependencies: 547
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4264 (class 0 OID 0)
-- Dependencies: 549
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- TOC entry 4265 (class 0 OID 0)
-- Dependencies: 550
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- TOC entry 4266 (class 0 OID 0)
-- Dependencies: 543
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- TOC entry 4267 (class 0 OID 0)
-- Dependencies: 544
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- TOC entry 4269 (class 0 OID 0)
-- Dependencies: 536
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM postgres;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- TOC entry 4271 (class 0 OID 0)
-- Dependencies: 384
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- TOC entry 4273 (class 0 OID 0)
-- Dependencies: 569
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM postgres;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- TOC entry 4274 (class 0 OID 0)
-- Dependencies: 541
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4275 (class 0 OID 0)
-- Dependencies: 540
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- TOC entry 4276 (class 0 OID 0)
-- Dependencies: 362
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision) TO dashboard_user;


--
-- TOC entry 4277 (class 0 OID 0)
-- Dependencies: 361
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- TOC entry 4278 (class 0 OID 0)
-- Dependencies: 360
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint) TO dashboard_user;


--
-- TOC entry 4279 (class 0 OID 0)
-- Dependencies: 565
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- TOC entry 4280 (class 0 OID 0)
-- Dependencies: 561
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- TOC entry 4281 (class 0 OID 0)
-- Dependencies: 555
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- TOC entry 4282 (class 0 OID 0)
-- Dependencies: 557
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4283 (class 0 OID 0)
-- Dependencies: 559
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- TOC entry 4284 (class 0 OID 0)
-- Dependencies: 556
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- TOC entry 4285 (class 0 OID 0)
-- Dependencies: 558
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4286 (class 0 OID 0)
-- Dependencies: 560
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- TOC entry 4287 (class 0 OID 0)
-- Dependencies: 378
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- TOC entry 4288 (class 0 OID 0)
-- Dependencies: 553
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- TOC entry 4289 (class 0 OID 0)
-- Dependencies: 552
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- TOC entry 4290 (class 0 OID 0)
-- Dependencies: 554
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4291 (class 0 OID 0)
-- Dependencies: 522
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- TOC entry 4292 (class 0 OID 0)
-- Dependencies: 516
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- TOC entry 4293 (class 0 OID 0)
-- Dependencies: 523
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- TOC entry 4294 (class 0 OID 0)
-- Dependencies: 519
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- TOC entry 4295 (class 0 OID 0)
-- Dependencies: 551
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- TOC entry 4296 (class 0 OID 0)
-- Dependencies: 520
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- TOC entry 4297 (class 0 OID 0)
-- Dependencies: 377
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- TOC entry 4298 (class 0 OID 0)
-- Dependencies: 521
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- TOC entry 4299 (class 0 OID 0)
-- Dependencies: 382
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- TOC entry 4300 (class 0 OID 0)
-- Dependencies: 383
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- TOC entry 4302 (class 0 OID 0)
-- Dependencies: 570
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- TOC entry 4303 (class 0 OID 0)
-- Dependencies: 363
-- Name: FUNCTION sign(payload json, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.sign(payload json, secret text, algorithm text) FROM postgres;
GRANT ALL ON FUNCTION extensions.sign(payload json, secret text, algorithm text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.sign(payload json, secret text, algorithm text) TO dashboard_user;


--
-- TOC entry 4304 (class 0 OID 0)
-- Dependencies: 364
-- Name: FUNCTION try_cast_double(inp text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.try_cast_double(inp text) FROM postgres;
GRANT ALL ON FUNCTION extensions.try_cast_double(inp text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.try_cast_double(inp text) TO dashboard_user;


--
-- TOC entry 4305 (class 0 OID 0)
-- Dependencies: 567
-- Name: FUNCTION url_decode(data text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.url_decode(data text) FROM postgres;
GRANT ALL ON FUNCTION extensions.url_decode(data text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.url_decode(data text) TO dashboard_user;


--
-- TOC entry 4306 (class 0 OID 0)
-- Dependencies: 566
-- Name: FUNCTION url_encode(data bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.url_encode(data bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.url_encode(data bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.url_encode(data bytea) TO dashboard_user;


--
-- TOC entry 4307 (class 0 OID 0)
-- Dependencies: 524
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- TOC entry 4308 (class 0 OID 0)
-- Dependencies: 525
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- TOC entry 4309 (class 0 OID 0)
-- Dependencies: 526
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- TOC entry 4310 (class 0 OID 0)
-- Dependencies: 527
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- TOC entry 4311 (class 0 OID 0)
-- Dependencies: 537
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- TOC entry 4312 (class 0 OID 0)
-- Dependencies: 372
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- TOC entry 4313 (class 0 OID 0)
-- Dependencies: 373
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- TOC entry 4314 (class 0 OID 0)
-- Dependencies: 375
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- TOC entry 4315 (class 0 OID 0)
-- Dependencies: 374
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- TOC entry 4316 (class 0 OID 0)
-- Dependencies: 376
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- TOC entry 4317 (class 0 OID 0)
-- Dependencies: 365
-- Name: FUNCTION verify(token text, secret text, algorithm text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.verify(token text, secret text, algorithm text) FROM postgres;
GRANT ALL ON FUNCTION extensions.verify(token text, secret text, algorithm text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.verify(token text, secret text, algorithm text) TO dashboard_user;


--
-- TOC entry 4318 (class 0 OID 0)
-- Dependencies: 391
-- Name: FUNCTION comment_directive(comment_ text); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql.comment_directive(comment_ text) TO postgres;
GRANT ALL ON FUNCTION graphql.comment_directive(comment_ text) TO anon;
GRANT ALL ON FUNCTION graphql.comment_directive(comment_ text) TO authenticated;
GRANT ALL ON FUNCTION graphql.comment_directive(comment_ text) TO service_role;


--
-- TOC entry 4319 (class 0 OID 0)
-- Dependencies: 390
-- Name: FUNCTION exception(message text); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql.exception(message text) TO postgres;
GRANT ALL ON FUNCTION graphql.exception(message text) TO anon;
GRANT ALL ON FUNCTION graphql.exception(message text) TO authenticated;
GRANT ALL ON FUNCTION graphql.exception(message text) TO service_role;


--
-- TOC entry 4320 (class 0 OID 0)
-- Dependencies: 389
-- Name: FUNCTION get_schema_version(); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql.get_schema_version() TO postgres;
GRANT ALL ON FUNCTION graphql.get_schema_version() TO anon;
GRANT ALL ON FUNCTION graphql.get_schema_version() TO authenticated;
GRANT ALL ON FUNCTION graphql.get_schema_version() TO service_role;


--
-- TOC entry 4321 (class 0 OID 0)
-- Dependencies: 388
-- Name: FUNCTION increment_schema_version(); Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql.increment_schema_version() TO postgres;
GRANT ALL ON FUNCTION graphql.increment_schema_version() TO anon;
GRANT ALL ON FUNCTION graphql.increment_schema_version() TO authenticated;
GRANT ALL ON FUNCTION graphql.increment_schema_version() TO service_role;


--
-- TOC entry 4322 (class 0 OID 0)
-- Dependencies: 386
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- TOC entry 4323 (class 0 OID 0)
-- Dependencies: 348
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: postgres
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- TOC entry 4324 (class 0 OID 0)
-- Dependencies: 530
-- Name: FUNCTION crypto_aead_det_decrypt(message bytea, additional bytea, key_uuid uuid, nonce bytea); Type: ACL; Schema: pgsodium; Owner: pgsodium_keymaker
--

GRANT ALL ON FUNCTION pgsodium.crypto_aead_det_decrypt(message bytea, additional bytea, key_uuid uuid, nonce bytea) TO service_role;


--
-- TOC entry 4325 (class 0 OID 0)
-- Dependencies: 531
-- Name: FUNCTION crypto_aead_det_encrypt(message bytea, additional bytea, key_uuid uuid, nonce bytea); Type: ACL; Schema: pgsodium; Owner: pgsodium_keymaker
--

GRANT ALL ON FUNCTION pgsodium.crypto_aead_det_encrypt(message bytea, additional bytea, key_uuid uuid, nonce bytea) TO service_role;


--
-- TOC entry 4326 (class 0 OID 0)
-- Dependencies: 532
-- Name: FUNCTION crypto_aead_det_keygen(); Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pgsodium.crypto_aead_det_keygen() TO service_role;


--
-- TOC entry 4327 (class 0 OID 0)
-- Dependencies: 369
-- Name: FUNCTION extension(name text); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.extension(name text) TO anon;
GRANT ALL ON FUNCTION storage.extension(name text) TO authenticated;
GRANT ALL ON FUNCTION storage.extension(name text) TO service_role;
GRANT ALL ON FUNCTION storage.extension(name text) TO dashboard_user;
GRANT ALL ON FUNCTION storage.extension(name text) TO postgres;


--
-- TOC entry 4328 (class 0 OID 0)
-- Dependencies: 368
-- Name: FUNCTION filename(name text); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.filename(name text) TO anon;
GRANT ALL ON FUNCTION storage.filename(name text) TO authenticated;
GRANT ALL ON FUNCTION storage.filename(name text) TO service_role;
GRANT ALL ON FUNCTION storage.filename(name text) TO dashboard_user;
GRANT ALL ON FUNCTION storage.filename(name text) TO postgres;


--
-- TOC entry 4329 (class 0 OID 0)
-- Dependencies: 367
-- Name: FUNCTION foldername(name text); Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON FUNCTION storage.foldername(name text) TO anon;
GRANT ALL ON FUNCTION storage.foldername(name text) TO authenticated;
GRANT ALL ON FUNCTION storage.foldername(name text) TO service_role;
GRANT ALL ON FUNCTION storage.foldername(name text) TO dashboard_user;
GRANT ALL ON FUNCTION storage.foldername(name text) TO postgres;


--
-- TOC entry 4331 (class 0 OID 0)
-- Dependencies: 265
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT ALL ON TABLE auth.audit_log_entries TO postgres;


--
-- TOC entry 4333 (class 0 OID 0)
-- Dependencies: 295
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.flow_state TO postgres;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- TOC entry 4336 (class 0 OID 0)
-- Dependencies: 286
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.identities TO postgres;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- TOC entry 4338 (class 0 OID 0)
-- Dependencies: 264
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT ALL ON TABLE auth.instances TO postgres;


--
-- TOC entry 4340 (class 0 OID 0)
-- Dependencies: 290
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.mfa_amr_claims TO postgres;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- TOC entry 4342 (class 0 OID 0)
-- Dependencies: 289
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.mfa_challenges TO postgres;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- TOC entry 4344 (class 0 OID 0)
-- Dependencies: 288
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.mfa_factors TO postgres;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- TOC entry 4346 (class 0 OID 0)
-- Dependencies: 263
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT ALL ON TABLE auth.refresh_tokens TO postgres;


--
-- TOC entry 4348 (class 0 OID 0)
-- Dependencies: 262
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- TOC entry 4350 (class 0 OID 0)
-- Dependencies: 293
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.saml_providers TO postgres;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- TOC entry 4352 (class 0 OID 0)
-- Dependencies: 294
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.saml_relay_states TO postgres;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- TOC entry 4354 (class 0 OID 0)
-- Dependencies: 266
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.schema_migrations TO dashboard_user;
GRANT ALL ON TABLE auth.schema_migrations TO postgres;


--
-- TOC entry 4357 (class 0 OID 0)
-- Dependencies: 287
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.sessions TO postgres;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- TOC entry 4359 (class 0 OID 0)
-- Dependencies: 292
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.sso_domains TO postgres;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- TOC entry 4362 (class 0 OID 0)
-- Dependencies: 291
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.sso_providers TO postgres;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- TOC entry 4365 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT ALL ON TABLE auth.users TO postgres;


--
-- TOC entry 4366 (class 0 OID 0)
-- Dependencies: 260
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- TOC entry 4367 (class 0 OID 0)
-- Dependencies: 259
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- TOC entry 4368 (class 0 OID 0)
-- Dependencies: 270
-- Name: SEQUENCE seq_schema_version; Type: ACL; Schema: graphql; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE graphql.seq_schema_version TO postgres;
GRANT ALL ON SEQUENCE graphql.seq_schema_version TO anon;
GRANT ALL ON SEQUENCE graphql.seq_schema_version TO authenticated;
GRANT ALL ON SEQUENCE graphql.seq_schema_version TO service_role;


--
-- TOC entry 4369 (class 0 OID 0)
-- Dependencies: 283
-- Name: TABLE decrypted_key; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE pgsodium.decrypted_key TO pgsodium_keyholder;


--
-- TOC entry 4370 (class 0 OID 0)
-- Dependencies: 281
-- Name: TABLE masking_rule; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE pgsodium.masking_rule TO pgsodium_keyholder;


--
-- TOC entry 4371 (class 0 OID 0)
-- Dependencies: 282
-- Name: TABLE mask_columns; Type: ACL; Schema: pgsodium; Owner: supabase_admin
--

GRANT ALL ON TABLE pgsodium.mask_columns TO pgsodium_keyholder;


--
-- TOC entry 4372 (class 0 OID 0)
-- Dependencies: 267
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres;


--
-- TOC entry 4373 (class 0 OID 0)
-- Dependencies: 269
-- Name: TABLE migrations; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.migrations TO anon;
GRANT ALL ON TABLE storage.migrations TO authenticated;
GRANT ALL ON TABLE storage.migrations TO service_role;
GRANT ALL ON TABLE storage.migrations TO postgres;


--
-- TOC entry 4374 (class 0 OID 0)
-- Dependencies: 268
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres;


--
-- TOC entry 2642 (class 826 OID 16597)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES  TO dashboard_user;


--
-- TOC entry 2643 (class 826 OID 16598)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS  TO dashboard_user;


--
-- TOC entry 2641 (class 826 OID 16596)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES  TO dashboard_user;


--
-- TOC entry 2660 (class 826 OID 16977)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES  TO postgres WITH GRANT OPTION;


--
-- TOC entry 2659 (class 826 OID 16976)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS  TO postgres WITH GRANT OPTION;


--
-- TOC entry 2658 (class 826 OID 16975)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES  TO postgres WITH GRANT OPTION;


--
-- TOC entry 2652 (class 826 OID 16623)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES  TO service_role;


--
-- TOC entry 2651 (class 826 OID 16622)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS  TO service_role;


--
-- TOC entry 2650 (class 826 OID 16621)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES  TO service_role;


--
-- TOC entry 2647 (class 826 OID 16611)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES  TO service_role;


--
-- TOC entry 2649 (class 826 OID 16610)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- TOC entry 2648 (class 826 OID 16609)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES  TO service_role;


--
-- TOC entry 2657 (class 826 OID 16837)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: pgsodium; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium GRANT ALL ON SEQUENCES  TO pgsodium_keyholder;


--
-- TOC entry 2656 (class 826 OID 16836)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: pgsodium; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium GRANT ALL ON TABLES  TO pgsodium_keyholder;


--
-- TOC entry 2654 (class 826 OID 16834)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: pgsodium_masks; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium_masks GRANT ALL ON SEQUENCES  TO pgsodium_keyiduser;


--
-- TOC entry 2655 (class 826 OID 16835)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: pgsodium_masks; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium_masks GRANT ALL ON FUNCTIONS  TO pgsodium_keyiduser;


--
-- TOC entry 2653 (class 826 OID 16833)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: pgsodium_masks; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA pgsodium_masks GRANT ALL ON TABLES  TO pgsodium_keyiduser;


--
-- TOC entry 2634 (class 826 OID 16484)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- TOC entry 2635 (class 826 OID 16485)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO service_role;


--
-- TOC entry 2633 (class 826 OID 16483)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- TOC entry 2637 (class 826 OID 16487)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS  TO service_role;


--
-- TOC entry 2632 (class 826 OID 16482)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- TOC entry 2636 (class 826 OID 16486)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES  TO service_role;


--
-- TOC entry 2645 (class 826 OID 16601)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES  TO dashboard_user;


--
-- TOC entry 2646 (class 826 OID 16602)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS  TO dashboard_user;


--
-- TOC entry 2644 (class 826 OID 16600)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES  TO dashboard_user;


--
-- TOC entry 2640 (class 826 OID 16539)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES  TO service_role;


--
-- TOC entry 2639 (class 826 OID 16538)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS  TO service_role;


--
-- TOC entry 2638 (class 826 OID 16537)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES  TO service_role;


--
-- TOC entry 3774 (class 3466 OID 16615)
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- TOC entry 3771 (class 3466 OID 16592)
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: postgres
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE SCHEMA')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO postgres;

--
-- TOC entry 3773 (class 3466 OID 16613)
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- TOC entry 3772 (class 3466 OID 16594)
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: postgres
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO postgres;

--
-- TOC entry 3775 (class 3466 OID 16616)
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- TOC entry 3776 (class 3466 OID 16617)
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

-- Completed on 2023-05-20 00:35:48

--
-- PostgreSQL database dump complete
--

