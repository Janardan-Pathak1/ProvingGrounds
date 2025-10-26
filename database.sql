--
-- PostgreSQL database dump
--

\restrict fdKtuFAavDPI2A4uAUURJoKS6vP3bAfHQOEvVS0HvLQT9n2KztCbagYhBsGlPuV

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ltree; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS ltree WITH SCHEMA public;


--
-- Name: EXTENSION ltree; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION ltree IS 'data type for hierarchical tree-like structures';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: alert_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.alert_category AS ENUM (
    'brute_force',
    'phishing',
    'network',
    'malware',
    'sql_injection',
    'email_security',
    'other'
);


ALTER TYPE public.alert_category OWNER TO postgres;

--
-- Name: case_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.case_status_enum AS ENUM (
    'open',
    'closed'
);


ALTER TYPE public.case_status_enum OWNER TO postgres;

--
-- Name: severity_level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.severity_level AS ENUM (
    'critical',
    'high',
    'medium',
    'low',
    'info'
);


ALTER TYPE public.severity_level OWNER TO postgres;

--
-- Name: generate_case_number(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_case_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.case_number IS NULL THEN
        NEW.case_number := 'CASE-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYY') || '-' || 
                          LPAD(nextval('cases_case_id_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_case_number() OWNER TO postgres;

--
-- Name: log_case_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_case_activity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO case_activities (case_id, user_id, activity_type, description, new_values)
        VALUES (NEW.case_id, NEW.created_by, 'Created', 'Case created', 
                jsonb_build_object('title', NEW.title, 'status_id', NEW.status_id));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO case_activities (case_id, user_id, activity_type, description, old_values, new_values)
        VALUES (NEW.case_id, NEW.assigned_to, 'Updated', 'Case updated',
                to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.log_case_activity() OWNER TO postgres;

--
-- Name: soft_delete_user(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.soft_delete_user(p_user_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE users
     SET username   = concat('deleted_user_', substring(user_id::text,1,8)),
         email      = concat(user_id::text, '@deleted.local'),
         password_hash = 'delWeted',
         deleted_at = NOW()
   WHERE user_id = p_user_id;

END;
$$;


ALTER FUNCTION public.soft_delete_user(p_user_id integer) OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alert_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alert_details (
    detail_id integer NOT NULL,
    alert_id integer,
    field_name character varying(100) NOT NULL,
    field_value text,
    field_type character varying(50),
    is_ioc boolean DEFAULT false,
    confidence_score numeric(3,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT alert_details_confidence_score_check CHECK (((confidence_score >= 0.00) AND (confidence_score <= 1.00)))
);


ALTER TABLE public.alert_details OWNER TO postgres;

--
-- Name: alert_details_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alert_details_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alert_details_detail_id_seq OWNER TO postgres;

--
-- Name: alert_details_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alert_details_detail_id_seq OWNED BY public.alert_details.detail_id;


--
-- Name: alert_investigations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alert_investigations (
    investigation_id integer NOT NULL,
    alert_id integer NOT NULL,
    user_id integer,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true NOT NULL,
    notes text
);


ALTER TABLE public.alert_investigations OWNER TO postgres;

--
-- Name: alert_investigations_investigation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alert_investigations_investigation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alert_investigations_investigation_id_seq OWNER TO postgres;

--
-- Name: alert_investigations_investigation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alert_investigations_investigation_id_seq OWNED BY public.alert_investigations.investigation_id;


--
-- Name: alert_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alert_types (
    type_id integer NOT NULL,
    type_name character varying(100) NOT NULL,
    category character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.alert_types OWNER TO postgres;

--
-- Name: alert_types_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alert_types_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alert_types_type_id_seq OWNER TO postgres;

--
-- Name: alert_types_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alert_types_type_id_seq OWNED BY public.alert_types.type_id;


--
-- Name: alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alerts (
    alert_id integer NOT NULL,
    event_id integer NOT NULL,
    rule_name character varying(255) NOT NULL,
    alert_type_id integer,
    severity_id integer,
    source_ip inet,
    destination_ip inet,
    source_port integer,
    destination_port integer,
    protocol character varying(10),
    event_time timestamp without time zone NOT NULL,
    detection_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    raw_message text,
    is_false_positive boolean DEFAULT false,
    status character varying(50) DEFAULT 'New'::character varying,
    tags text[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_closed boolean DEFAULT false,
    closed_at timestamp without time zone,
    closed_by integer,
    closure_reason text,
    closure_result text,
    malicious_entity text,
    feedback text,
    expected_result character varying(32),
    user_assessment_correct boolean,
    answers_provided boolean DEFAULT false,
    answers_correct boolean,
    answers_summary jsonb,
    CONSTRAINT alerts_destination_port_check CHECK (((destination_port >= 1) AND (destination_port <= 65535))),
    CONSTRAINT alerts_source_port_check CHECK (((source_port >= 1) AND (source_port <= 65535)))
);


ALTER TABLE public.alerts OWNER TO postgres;

--
-- Name: alerts_alert_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alerts_alert_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alerts_alert_id_seq OWNER TO postgres;

--
-- Name: alerts_alert_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alerts_alert_id_seq OWNED BY public.alerts.alert_id;


--
-- Name: case_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.case_status (
    status_id integer NOT NULL,
    status_name character varying(50) NOT NULL,
    status_description text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.case_status OWNER TO postgres;

--
-- Name: case_status_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.case_status_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.case_status_status_id_seq OWNER TO postgres;

--
-- Name: case_status_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.case_status_status_id_seq OWNED BY public.case_status.status_id;


--
-- Name: case_user_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.case_user_responses (
    id integer NOT NULL,
    case_id integer NOT NULL,
    user_id integer NOT NULL,
    answers jsonb NOT NULL,
    total_points integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.case_user_responses OWNER TO postgres;

--
-- Name: case_user_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.case_user_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.case_user_responses_id_seq OWNER TO postgres;

--
-- Name: case_user_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.case_user_responses_id_seq OWNED BY public.case_user_responses.id;


--
-- Name: cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cases (
    case_id integer NOT NULL,
    case_number character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    priority integer DEFAULT 3,
    status_id integer,
    assigned_to integer,
    created_by integer,
    alert_id integer,
    due_date timestamp without time zone,
    resolution_notes text,
    time_spent interval,
    escalation_level integer DEFAULT 1,
    is_closed boolean DEFAULT false,
    closed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cases_priority_check CHECK (((priority >= 1) AND (priority <= 5)))
);


ALTER TABLE public.cases OWNER TO postgres;

--
-- Name: cases_case_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cases_case_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cases_case_id_seq OWNER TO postgres;

--
-- Name: cases_case_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cases_case_id_seq OWNED BY public.cases.case_id;


--
-- Name: email_security; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_security (
    email_alert_id integer NOT NULL,
    alert_id integer,
    sender_email character varying(255),
    recipient_email character varying(255),
    email_subject text,
    message_id character varying(255),
    smtp_server character varying(255),
    attachment_hashes text[],
    url_links text[],
    spf_result character varying(20),
    dkim_result character varying(20),
    dmarc_result character varying(20),
    spam_score numeric(4,2),
    phishing_score numeric(4,2),
    threat_category character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_security OWNER TO postgres;

--
-- Name: email_security_email_alert_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_security_email_alert_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_security_email_alert_id_seq OWNER TO postgres;

--
-- Name: email_security_email_alert_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_security_email_alert_id_seq OWNED BY public.email_security.email_alert_id;


--
-- Name: severity_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.severity_levels (
    severity_id integer NOT NULL,
    severity_level integer NOT NULL,
    severity_name character varying(50) NOT NULL,
    severity_description text,
    color_code character varying(7),
    response_time_sla interval,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT severity_levels_severity_level_check CHECK (((severity_level >= 0) AND (severity_level <= 15)))
);


ALTER TABLE public.severity_levels OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255),
    role character varying(50) DEFAULT 'SOC-L1'::character varying NOT NULL,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    password_hash text NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_user_not_deleted CHECK (((deleted_at IS NULL) OR (deleted_at > created_at)))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: investigation_alerts_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.investigation_alerts_view AS
 SELECT a.alert_id,
    a.event_id,
    a.rule_name,
    a.alert_type_id,
    a.severity_id,
    a.source_ip,
    a.destination_ip,
    a.source_port,
    a.destination_port,
    a.protocol,
    a.event_time,
    a.detection_time,
    a.raw_message,
    a.is_false_positive,
    a.status,
    a.tags,
    a.created_at,
    a.updated_at,
    a.is_closed,
    a.closed_at,
    a.closed_by,
    sl.severity_name,
    ai.investigation_id,
    ai.user_id AS investigating_user_id,
    ai.started_at AS investigation_started,
    ai.notes AS investigation_notes,
    u.username AS investigating_username
   FROM (((public.alerts a
     JOIN public.severity_levels sl ON ((a.severity_id = sl.severity_id)))
     LEFT JOIN public.alert_investigations ai ON (((a.alert_id = ai.alert_id) AND (ai.is_active = true))))
     LEFT JOIN public.users u ON (((ai.user_id = u.user_id) AND (u.deleted_at IS NULL))))
  WHERE (a.is_closed = false);


ALTER VIEW public.investigation_alerts_view OWNER TO postgres;

--
-- Name: log_management; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.log_management (
    log_id integer NOT NULL,
    event_id integer,
    log_source character varying(100) NOT NULL,
    source_ip inet,
    destination_ip inet,
    source_port integer,
    destination_port integer,
    user_name character varying(100),
    computer_name character varying(100),
    process_name character varying(255),
    command_line text,
    log_level character varying(20),
    event_code integer,
    message text NOT NULL,
    raw_log text,
    parsed_fields jsonb,
    geolocation jsonb,
    threat_intel_match boolean DEFAULT false,
    log_time timestamp without time zone NOT NULL,
    ingestion_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT log_management_destination_port_check CHECK (((destination_port >= 1) AND (destination_port <= 65535))),
    CONSTRAINT log_management_source_port_check CHECK (((source_port >= 1) AND (source_port <= 65535))),
    CONSTRAINT valid_ips CHECK ((((source_ip IS NULL) OR (source_ip <> '0.0.0.0'::inet)) AND ((destination_ip IS NULL) OR (destination_ip <> '0.0.0.0'::inet))))
);


ALTER TABLE public.log_management OWNER TO postgres;

--
-- Name: log_management_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.log_management_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.log_management_log_id_seq OWNER TO postgres;

--
-- Name: log_management_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.log_management_log_id_seq OWNED BY public.log_management.log_id;


--
-- Name: severity_levels_severity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.severity_levels_severity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.severity_levels_severity_id_seq OWNER TO postgres;

--
-- Name: severity_levels_severity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.severity_levels_severity_id_seq OWNED BY public.severity_levels.severity_id;


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: alert_details detail_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_details ALTER COLUMN detail_id SET DEFAULT nextval('public.alert_details_detail_id_seq'::regclass);


--
-- Name: alert_investigations investigation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_investigations ALTER COLUMN investigation_id SET DEFAULT nextval('public.alert_investigations_investigation_id_seq'::regclass);


--
-- Name: alert_types type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_types ALTER COLUMN type_id SET DEFAULT nextval('public.alert_types_type_id_seq'::regclass);


--
-- Name: alerts alert_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts ALTER COLUMN alert_id SET DEFAULT nextval('public.alerts_alert_id_seq'::regclass);


--
-- Name: case_status status_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_status ALTER COLUMN status_id SET DEFAULT nextval('public.case_status_status_id_seq'::regclass);


--
-- Name: case_user_responses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_user_responses ALTER COLUMN id SET DEFAULT nextval('public.case_user_responses_id_seq'::regclass);


--
-- Name: cases case_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases ALTER COLUMN case_id SET DEFAULT nextval('public.cases_case_id_seq'::regclass);


--
-- Name: email_security email_alert_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_security ALTER COLUMN email_alert_id SET DEFAULT nextval('public.email_security_email_alert_id_seq'::regclass);


--
-- Name: log_management log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_management ALTER COLUMN log_id SET DEFAULT nextval('public.log_management_log_id_seq'::regclass);


--
-- Name: severity_levels severity_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.severity_levels ALTER COLUMN severity_id SET DEFAULT nextval('public.severity_levels_severity_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: alert_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alert_details (detail_id, alert_id, field_name, field_value, field_type, is_ioc, confidence_score, created_at) FROM stdin;
\.


--
-- Data for Name: alert_investigations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alert_investigations (investigation_id, alert_id, user_id, started_at, is_active, notes) FROM stdin;
17	2	1	2025-09-01 18:06:59.110008	f	\N
24	1	1	2025-09-07 20:36:38.715561	f	Alert re-opened for investigation
4	3	3	2025-08-19 15:17:55.919168	f	\N
26	4	1	2025-10-10 10:13:27.961861	f	\N
27	3	1	2025-10-23 10:53:23.279973	f	Alert re-opened for investigation
28	4	1	2025-10-23 11:04:37.450316	f	\N
29	1	1	2025-10-23 11:25:21.486753	f	\N
30	3	1	2025-10-23 12:56:47.585244	f	\N
31	4	7	2025-10-23 15:38:12.675297	f	\N
39	3	6	2025-10-26 10:00:02.182071	f	\N
40	2	6	2025-10-26 10:00:03.903721	f	\N
42	1	7	2025-10-26 10:07:52.984007	f	\N
44	4	6	2025-10-26 10:45:47.732427	f	\N
45	1	6	2025-10-26 20:08:28.318728	f	\N
\.


--
-- Data for Name: alert_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alert_types (type_id, type_name, category, description, is_active, created_at) FROM stdin;
1	Phishing Alert	email_security	Deceptive phishing email alert	t	2025-07-23 13:34:46.091761
2	Forced Authentication	network	Detected repeated login attempts to fixed URI	t	2025-07-23 13:34:46.091761
3	CVE-2024-24919 - Arbitrary File Read	network	Exploitation of Checkpoint Security Gateway arbitrary file read vulnerability	t	2025-07-23 13:34:46.091761
4	SQL Injection	web	Detected SQL injection attempts	t	2025-09-06 19:27:23.605643
5	Brute Force	authentication	Detected brute force login attempts	t	2025-09-06 19:27:31.787998
\.


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alerts (alert_id, event_id, rule_name, alert_type_id, severity_id, source_ip, destination_ip, source_port, destination_port, protocol, event_time, detection_time, raw_message, is_false_positive, status, tags, created_at, updated_at, is_closed, closed_at, closed_by, closure_reason, closure_result, malicious_entity, feedback, expected_result, user_assessment_correct, answers_provided, answers_correct, answers_summary) FROM stdin;
2	208	SOC246 - Forced Authentication Detected	2	2	120.48.36.175	104.26.15.61	\N	\N	HTTP	2023-12-12 14:15:00	2025-07-23 13:35:03.749891	Multiple POST requests from 120.48.36.175 to /accounts/login detected by rule SOC246.	f	New	\N	2025-07-23 13:35:03.749891	2025-07-23 13:35:03.749891	f	\N	\N	\N	\N	\N	\N	True Positive	\N	f	\N	\N
3	2625	SOC176 - RDP Brute Force Detected	5	3	218.92.0.56	172.16.17.148	18845	3389	RDP	2024-03-07 11:44:00	2025-07-23 13:35:50.328624	Login failure from a single source with different non-existing accounts	f	Open	{rdp,brute_force}	2025-07-23 13:35:50.328624	2025-10-23 15:31:33.978019	f	\N	\N	\N	\N	\N	\N	True Positive	\N	f	f	\N
4	257	SOC282 - Phishing Alert - Deceptive Mail Detected	1	1	103.80.134.63	\N	\N	\N	SMTP	2024-05-13 09:22:00	2025-07-23 13:35:58.533177	Phishing email with subject "Free Coffee Voucher" received from free@coffeeshooop.com to Felix@letsdefend.io	f	Closed	\N	2025-07-23 13:35:58.533177	2025-10-26 20:08:10.105689	f	2025-10-26 10:45:51.457087	6	\N	Correct	\N	\N	True Positive	\N	f	f	\N
1	942100	SOC127 - SQL Injection Detected	4	3	118.194.247.28	172.16.20.12	44023	80	HTTP	2024-03-07 12:51:00	2025-07-23 13:34:59.793359	Multiple suspicious SQL injection payloads detected from source IP 118.194.247.28 targeting WebServer1000	f	Under Investigation	{sql_injection,web,sqlmap}	2025-07-23 13:34:59.793359	2025-10-26 20:09:52.907054	f	2025-10-26 20:08:51.767335	6	\N	False Positive	\N	\N	True Positive	f	f	f	\N
\.


--
-- Data for Name: case_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.case_status (status_id, status_name, status_description, is_active, sort_order, created_at) FROM stdin;
1	open	Case is currently being investigated	t	0	2025-07-23 14:19:44.891887
2	closed	Case has been resolved	t	0	2025-07-23 14:19:44.891887
3	in_progress	Case is actively being worked on	t	0	2025-07-23 14:19:44.891887
\.


--
-- Data for Name: case_user_responses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.case_user_responses (id, case_id, user_id, answers, total_points, created_at, updated_at) FROM stdin;
1	29	1	[{"answer": "Malicious Attachment", "question": "Was the email flagged due to a suspicious domain or a malicious attachment?"}, {"answer": "Yes", "question": "Did the logs capture users opening or downloading the attachment?"}, {"answer": "No", "question": "Was the attachment type flagged before (e.g., .exe, .docm)?"}, {"answer": "Yes", "question": "Did the endpoint logs show execution of suspicious processes after download?"}]	0	2025-10-23 11:24:35.926279	2025-10-23 11:24:35.926279
2	31	1	[{"answer": "Suspicious Domain", "question": "Was the email flagged due to a suspicious domain or a malicious attachment?"}, {"answer": "No", "question": "Do the logs show multiple emails sent from the same domain within a short time?"}, {"answer": "Yes", "question": "Were the recipient accounts high-value (e.g., admins, finance)?"}, {"answer": "No", "question": "Did users who received the email attempt to log in from new IP addresses afterward?"}]	0	2025-10-23 11:37:16.647146	2025-10-23 11:37:16.647146
3	33	1	[{"answer": "Suspicious Domain", "question": "Was the email flagged due to a suspicious domain or a malicious attachment?"}, {"answer": "No", "question": "Do the logs show multiple emails sent from the same domain within a short time?"}, {"answer": "Yes", "question": "Were the recipient accounts high-value (e.g., admins, finance)?"}, {"answer": "No", "question": "Did users who received the email attempt to log in from new IP addresses afterward?"}]	0	2025-10-23 11:51:23.918344	2025-10-23 11:51:23.918344
4	35	1	[{"answer": "Malicious Attachment", "question": "Was the email flagged due to a suspicious domain or a malicious attachment?"}, {"answer": "Yes", "question": "Did the logs capture users opening or downloading the attachment?"}, {"answer": "No", "question": "Was the attachment type flagged before (e.g., .exe, .docm)?"}, {"answer": "Yes", "question": "Did the endpoint logs show execution of suspicious processes after download?"}]	0	2025-10-23 12:05:53.359709	2025-10-23 12:05:53.359709
5	37	1	[{"answer": "Malicious Attachment", "question": "Was the email flagged due to a suspicious domain or a malicious attachment?"}, {"answer": "Yes", "question": "Did the logs capture users opening or downloading the attachment?"}, {"answer": "No", "question": "Was the attachment type flagged before (e.g., .exe, .docm)?"}, {"answer": "Yes", "question": "Did the endpoint logs show execution of suspicious processes after download?"}]	0	2025-10-23 12:16:06.7591	2025-10-23 12:16:06.7591
6	39	1	[{"answer": "Malicious Attachment", "question": "Was the email flagged due to a suspicious domain or a malicious attachment?"}, {"answer": "Yes", "question": "Did the logs capture users opening or downloading the attachment?"}, {"answer": "No", "question": "Was the attachment type flagged before (e.g., .exe, .docm)?"}, {"answer": "Yes", "question": "Did the endpoint logs show execution of suspicious processes after download?"}]	0	2025-10-23 12:37:46.54356	2025-10-23 12:37:46.54356
7	41	1	[{"answer": "Malicious Attachment", "question": "Was the email flagged due to a suspicious domain or a malicious attachment?"}, {"answer": "Yes", "question": "Did the logs capture users opening or downloading the attachment?"}, {"answer": "No", "question": "Was the attachment type flagged before (e.g., .exe, .docm)?"}, {"answer": "Yes", "question": "Did the endpoint logs show execution of suspicious processes after download?"}]	0	2025-10-23 12:45:41.534863	2025-10-23 12:45:41.534863
8	43	6	[{"answer": "Malicious Attachment", "question": "Was the email flagged due to a suspicious domain or a malicious attachment?"}, {"answer": "Yes", "question": "Did the logs capture users opening or downloading the attachment?"}, {"answer": "Yes", "question": "Was the attachment type flagged before (e.g., .exe, .docm)?"}, {"answer": "No", "question": "Did the endpoint logs show execution of suspicious processes after download?"}]	0	2025-10-24 10:21:09.683626	2025-10-24 10:21:09.683626
9	45	6	[{"answer": "Unusual Queries", "question": "Was the injection attempt detected via error messages or unusual query patterns?"}, {"answer": "Yes", "question": "Did the query contain suspicious keywords (UNION, SELECT, DROP)?"}, {"answer": "No", "question": "Was the query executed outside of normal business hours?"}, {"answer": "Yes", "question": "Did the query size or structure differ significantly from normal requests?"}]	0	2025-10-26 20:09:52.970117	2025-10-26 20:09:52.970117
\.


--
-- Data for Name: cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cases (case_id, case_number, title, description, priority, status_id, assigned_to, created_by, alert_id, due_date, resolution_notes, time_spent, escalation_level, is_closed, closed_at, created_at, updated_at) FROM stdin;
5	CASE-2025-000006	Investigation for alert 2625	Auto-created case for investigation.	3	\N	1	1	3	\N	\N	\N	1	f	\N	2025-07-23 14:05:48.723256	2025-09-01 13:38:56.126865
7	CASE-2025-000008	Investigation for alert 208	Auto-created case for investigation.	3	1	1	1	2	\N	\N	\N	1	f	\N	2025-07-23 14:24:15.975628	2025-09-01 13:38:56.126865
15	CASE-2025-000016	Investigation Case for Alert 3	Case created from investigation of alert 3	3	1	1	1	3	\N	\N	\N	1	f	\N	2025-09-01 13:14:13.900053	2025-09-01 13:38:56.126865
17	CASE-2025-000018	Investigation Case for Alert 2	Case created from investigation of alert 2	3	1	1	1	2	\N	\N	\N	1	f	\N	2025-09-01 18:10:08.310942	2025-09-01 18:10:08.310942
19	CASE-2025-000020	Investigation Case for Alert 4	Case created from investigation of alert 4	3	1	1	1	4	\N	\N	\N	1	f	2025-10-26 10:16:10.004683	2025-10-10 10:13:50.770385	2025-10-26 20:08:10.110837
21	CASE-2025-000022	Investigation Case for Alert 4	Case created from investigation of alert 4	3	1	1	1	4	\N	\N	\N	1	f	2025-10-26 10:16:10.004683	2025-10-23 11:05:31.864121	2025-10-26 20:08:10.110837
23	CASE-2025-000024	Investigation Case for Alert 4	Case created from investigation of alert 4	3	1	1	1	4	\N	\N	\N	1	f	2025-10-26 10:16:10.004683	2025-10-23 11:12:37.190763	2025-10-26 20:08:10.110837
25	CASE-2025-000026	Investigation Case for Alert 4	Case created from investigation of alert 4	3	1	1	1	4	\N	\N	\N	1	f	2025-10-26 10:16:10.004683	2025-10-23 11:15:29.832267	2025-10-26 20:08:10.110837
27	CASE-2025-000028	Investigation Case for Alert 4	Case created from investigation of alert 4	3	1	1	1	4	\N	\N	\N	1	f	2025-10-26 10:16:10.004683	2025-10-23 11:16:54.012737	2025-10-26 20:08:10.110837
29	CASE-2025-000030	Investigation Case for Alert 4	Case created from investigation of alert 4	3	1	1	1	4	\N	\N	\N	1	f	2025-10-26 10:16:10.004683	2025-10-23 11:24:35.898319	2025-10-26 20:08:10.110837
31	CASE-2025-000032	Investigation Case for Alert 4	Case created from investigation of alert 4	3	1	1	1	4	\N	\N	\N	1	f	2025-10-26 10:16:10.004683	2025-10-23 11:37:16.574576	2025-10-26 20:08:10.110837
33	CASE-2025-000034	Investigation Case for Alert 4	Case created from investigation of alert 4	3	1	1	1	4	\N	\N	\N	1	f	2025-10-26 10:16:10.004683	2025-10-23 11:51:23.845484	2025-10-26 20:08:10.110837
35	CASE-2025-000036	Investigation Case for Alert 4	Case created from investigation of alert 4	3	1	1	1	4	\N	\N	\N	1	f	2025-10-26 10:16:10.004683	2025-10-23 12:05:53.284235	2025-10-26 20:08:10.110837
37	CASE-2025-000038	Investigation Case for Alert 4	Case created from investigation of alert 4	3	1	1	1	4	\N	\N	\N	1	f	2025-10-26 10:16:10.004683	2025-10-23 12:16:06.713341	2025-10-26 20:08:10.110837
39	CASE-2025-000040	Investigation Case for Alert 4	Case created from investigation of alert 4	3	1	1	1	4	\N	\N	\N	1	f	2025-10-26 10:16:10.004683	2025-10-23 12:37:46.472038	2025-10-26 20:08:10.110837
41	CASE-2025-000042	Investigation Case for Alert 4	Case created from investigation of alert 4	3	1	1	1	4	\N	\N	\N	1	f	2025-10-26 10:16:10.004683	2025-10-23 12:45:41.453804	2025-10-26 20:08:10.110837
1	CASE-2025-000002	Investigation for alert 257	Auto-created case for investigation.	3	\N	\N	1	4	\N	\N	\N	1	f	2025-10-26 10:16:10.004683	2025-07-23 13:40:58.411968	2025-10-26 20:08:10.110837
43	CASE-2025-000044	Investigation Case for Alert 4	Case created from investigation of alert 4	3	1	6	6	4	\N	\N	\N	1	f	2025-10-26 10:16:10.004683	2025-10-24 10:21:09.610252	2025-10-26 20:08:10.110837
3	CASE-2025-000004	Investigation for alert 942100	Auto-created case for investigation.	3	\N	1	1	1	\N	\N	\N	1	f	2025-10-26 20:08:51.77185	2025-07-23 13:44:15.766339	2025-10-26 20:08:55.106607
9	CASE-2025-000010	Investigation Case for Alert 942100	Case created from investigation of alert 942100	3	1	1	1	1	\N	\N	\N	1	f	2025-10-26 20:08:51.77185	2025-08-19 15:52:07.695053	2025-10-26 20:08:55.106607
45	CASE-2025-000046	Investigation Case for Alert 1	Case created from investigation of alert 1	3	1	6	6	1	\N	\N	\N	1	f	\N	2025-10-26 20:09:52.907054	2025-10-26 20:09:52.907054
\.


--
-- Data for Name: email_security; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_security (email_alert_id, alert_id, sender_email, recipient_email, email_subject, message_id, smtp_server, attachment_hashes, url_links, spf_result, dkim_result, dmarc_result, spam_score, phishing_score, threat_category, created_at) FROM stdin;
\.


--
-- Data for Name: log_management; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.log_management (log_id, event_id, log_source, source_ip, destination_ip, source_port, destination_port, user_name, computer_name, process_name, command_line, log_level, event_code, message, raw_log, parsed_fields, geolocation, threat_intel_match, log_time, ingestion_time) FROM stdin;
1	942100	Proxy	118.194.247.28	172.16.20.12	44023	80	\N	\N	\N	\N	WARNING	\N	SQL injection probe detected in request	GET /index.php?id=1';WAITFOR DELAY '0:0:5'--	\N	\N	f	2024-03-07 12:51:00	2025-07-23 13:34:59.843086
2	942100	Proxy	118.194.247.28	172.16.20.12	47513	80	\N	\N	\N	\N	WARNING	\N	SQL injection probe detected in request	GET /index.php?id=1') AND 2574=CAST((CHR(113)||CHR(107)||CHR(107)||CHR(118)||CHR(113))||(SELECT (CASE WHEN (2574=2574) THEN 1 ELSE 0 END))::text||(CHR(113)||CHR(112)||CHR(122)||CHR(106)||CHR(113)) AS NUMERIC) AND ('FiHf'='FiHf	\N	\N	f	2024-03-07 12:51:00	2025-07-23 13:34:59.843086
3	942100	Proxy	118.194.247.28	172.16.20.12	48751	80	\N	\N	\N	\N	WARNING	\N	SQL injection probe detected in request	GET /index.php?id=1) AND 2574=CAST((CHR(113)||CHR(107)||CHR(107)||CHR(118)||CHR(113))||(SELECT (CASE WHEN (2574=2574) THEN 1 ELSE 0 END))::text||(CHR(113)||CHR(112)||CHR(122)||CHR(106)||CHR(113)) AS NUMERIC) AND (9806=9806	\N	\N	f	2024-03-07 12:51:00	2025-07-23 13:34:59.843086
4	942100	Proxy	118.194.247.28	172.16.20.12	28416	80	\N	\N	\N	\N	WARNING	\N	Normal web request (suspicious context)	GET /	\N	\N	f	2024-03-07 12:51:00	2025-07-23 13:34:59.843086
5	942100	Proxy	118.194.247.28	172.16.20.12	35244	51197	\N	\N	\N	\N	WARNING	\N	SQL Injection using extractvalue technique	GET /index.php?id=1 AND EXTRACTVALUE(7321,CONCAT(0x5c,0x716b6b7671,(SELECT (ELT(7321=7321,1))),0x71707a6a71))	\N	\N	f	2024-03-07 12:51:00	2025-07-23 13:34:59.843086
6	942100	Proxy	118.194.247.28	172.16.20.12	49925	32716	\N	\N	\N	\N	WARNING	\N	SQL Injection with conditional UNION SELECT	GET /index.php?id=(SELECT (CASE WHEN (4611=4629) THEN 1 ELSE (SELECT 4629 UNION SELECT 6288) END))	\N	\N	f	2024-03-07 12:51:00	2025-07-23 13:34:59.843086
7	942100	Proxy	118.194.247.28	172.16.20.12	45163	80	\N	\N	\N	\N	WARNING	\N	XSS + SQLi + Command Injection Attempt	GET /?douj=3034 AND 1=1 UNION ALL SELECT 1,NULL,'<script>alert("XSS")</script>',table_name FROM information_schema.tables WHERE 2>1--/**/; EXEC xp_cmdshell('cat ../../../etc/passwd')#	\N	\N	f	2024-03-07 12:51:00	2025-07-23 13:34:59.843086
8	208	Proxy	120.48.36.175	104.26.15.61	\N	\N	\N	\N	\N	\N	INFO	1	POST to /accounts/login with root creds	Username=root&Password=123456	\N	\N	f	2023-12-12 14:05:00	2025-07-23 13:35:03.799459
9	208	Proxy	120.48.36.175	104.26.15.61	\N	\N	\N	\N	\N	\N	INFO	1	POST to /accounts/login with admin creds	Username=admin&Password=12345	\N	\N	f	2023-12-12 14:06:00	2025-07-23 13:35:03.799459
10	208	Firewall	120.48.36.175	104.26.15.61	\N	\N	\N	\N	\N	\N	WARNING	2	Firewall denied access to FTP port	FW Deny on port 21	\N	\N	f	2023-12-12 13:50:00	2025-07-23 13:35:03.799459
11	208	Firewall	120.48.36.175	104.26.15.61	\N	\N	\N	\N	\N	\N	WARNING	2	Firewall denied RDP access attempt	FW Deny on port 3389	\N	\N	f	2023-12-12 14:02:00	2025-07-23 13:35:03.799459
12	208	Firewall	120.48.36.175	104.26.15.61	\N	\N	\N	\N	\N	\N	INFO	2	Firewall permitted access to port 3000	FW Permit on port 3000	\N	\N	f	2023-12-12 13:59:00	2025-07-23 13:35:03.799459
13	208	Firewall	120.48.36.175	104.26.15.61	\N	\N	\N	\N	\N	\N	WARNING	2	Firewall denied HTTPS port	FW Deny on port 443	\N	\N	f	2023-12-12 13:58:00	2025-07-23 13:35:03.799459
14	208	Firewall	120.48.36.175	104.26.15.61	\N	\N	\N	\N	\N	\N	WARNING	2	Firewall denied POP3 port	FW Deny on port 110	\N	\N	f	2023-12-12 13:55:00	2025-07-23 13:35:03.799459
15	208	Firewall	120.48.36.175	104.26.15.61	\N	\N	\N	\N	\N	\N	INFO	2	Firewall permitted HTTP access	FW Permit on port 80	\N	\N	f	2023-12-12 13:54:00	2025-07-23 13:35:03.799459
16	208	Firewall	120.48.36.175	104.26.15.61	\N	\N	\N	\N	\N	\N	WARNING	2	Firewall denied DNS port	FW Deny on port 53	\N	\N	f	2023-12-12 13:53:00	2025-07-23 13:35:03.799459
17	208	Firewall	120.48.36.175	104.26.15.61	\N	\N	\N	\N	\N	\N	WARNING	2	Firewall denied SMTP port	FW Deny on port 25	\N	\N	f	2023-12-12 13:52:00	2025-07-23 13:35:03.799459
38	2625	OS	218.92.0.56	172.16.17.148	18845	3389	admin	\N	\N	\N	WARNING	4625	Login failed for user admin. Error Code: 0xC000006D	4625(An account failed to log on) - Username: admin - Error Code: 0xC000006D - Source IP: 218.92.0.56	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
39	2625	OS	218.92.0.56	172.16.17.148	51707	3389	guest	\N	\N	\N	WARNING	4625	Login failed for user guest. Error Code: 0xC000006D	4625(An account failed to log on) - Username: guest - Error Code: 0xC000006D - Source IP: 218.92.0.56	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
40	2625	OS	218.92.0.56	172.16.17.148	22667	3389	admin	\N	\N	\N	WARNING	4625	Login failed for user admin. Error Code: 0xC000006D	4625(An account failed to log on) - Username: admin - Error Code: 0xC000006D - Source IP: 218.92.0.56	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
41	2625	OS	218.92.0.56	172.16.17.148	16594	3389	admin	\N	\N	\N	WARNING	4625	Login failed for user admin. Error Code: 0xC000006D	4625(An account failed to log on) - Username: admin - Error Code: 0xC000006D - Source IP: 218.92.0.56	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
42	2625	OS	218.92.0.56	172.16.17.148	35346	3389	guest	\N	\N	\N	WARNING	4625	Login failed for user guest. Error Code: 0xC000006D	4625(An account failed to log on) - Username: guest - Error Code: 0xC000006D - Source IP: 218.92.0.56	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
43	2625	Firewall	218.92.0.56	172.16.17.148	50807	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
44	2625	Firewall	218.92.0.56	172.16.17.148	24319	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
45	2625	Firewall	218.92.0.56	172.16.17.148	10098	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
46	2625	Firewall	218.92.0.56	172.16.17.148	41175	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
47	2625	Firewall	218.92.0.56	172.16.17.148	61506	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
48	2625	Firewall	218.92.0.56	172.16.17.148	27876	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
49	2625	Firewall	218.92.0.56	172.16.17.148	37195	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
50	2625	Firewall	218.92.0.56	172.16.17.148	52534	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
51	2625	Firewall	218.92.0.56	172.16.17.148	33376	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
52	2625	Firewall	218.92.0.56	172.16.17.148	31454	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
53	2625	Firewall	218.92.0.56	172.16.17.148	32029	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
54	2625	Firewall	218.92.0.56	172.16.17.148	52316	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
55	2625	Firewall	218.92.0.56	172.16.17.148	16578	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
56	2625	Firewall	218.92.0.56	172.16.17.148	15563	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
57	2625	Firewall	218.92.0.56	172.16.17.148	47364	3389	\N	\N	\N	\N	WARNING	\N	Brute force login attempt detected via firewall logs	\N	\N	\N	f	2024-03-07 11:44:00	2025-07-23 13:35:50.334667
58	257	Proxy	172.16.17.14	198.100.45.154	\N	\N	\N	\N	powershell.exe	\N	INFO	1	PowerShell download from http://qstride.com/img/0/	Request Method: GET	\N	\N	f	2020-08-29 22:28:00	2025-07-23 13:35:58.585765
59	257	Proxy	172.16.17.14	67.68.210.95	\N	\N	\N	\N	rasser.exe	\N	INFO	1	Suspicious POST to 67.68.210.95	Request Method: POST	\N	\N	f	2020-08-29 22:32:00	2025-07-23 13:35:58.585765
60	257	Proxy	172.16.17.144	140.82.121.4	\N	\N	\N	\N	\N	\N	INFO	1	GitHub SauronEye release accessed	URL: https://github.com/vivami/SauronEye/releases	\N	\N	f	2023-04-13 10:14:00	2025-07-23 13:35:58.585765
61	257	OS	172.16.17.144	172.16.17.144	\N	\N	\N	\N	\N	SauronEye.exe -d C:\\\\Users\\\\LetsDefend\\\\Desktop\\\\ --filetypes .txt	INFO	1	Process created by cmd.exe	\N	\N	\N	f	2023-04-13 10:14:00	2025-07-23 13:35:58.585765
62	257	Firewall	172.16.17.141	138.197.116.56	\N	\N	\N	\N	/root/btcoin.elf	\N	INFO	1	Bitcoin miner traffic	\N	\N	\N	f	2023-08-10 07:14:00	2025-07-23 13:35:58.585765
63	257	Proxy	172.16.17.141	3.121.139.82	\N	\N	\N	\N	ulyos.sh	\N	INFO	1	Download of btcoin.elf via ngrok	GET http://4.tcp.eu.ngrok.io:16076/btcoin.elf	\N	\N	f	2023-08-10 07:11:00	2025-07-23 13:35:58.585765
64	257	OS	172.16.17.143	172.16.17.143	\N	\N	\N	\N	Explorer.EXE	\N	INFO	11	Job Opportunity.rar file created	\N	\N	\N	f	2023-09-06 06:00:00	2025-07-23 13:35:58.585765
65	257	OS	172.16.17.143	172.16.17.143	\N	\N	\N	\N	7zG.exe	\N	INFO	11	Extracted Job Opportunity.pdf	\N	\N	\N	f	2023-09-06 06:00:00	2025-07-23 13:35:58.585765
66	257	OS	172.16.17.143	172.16.17.143	\N	\N	\N	\N	chrome.exe	\N	INFO	1	PDF opened via Chrome	\N	\N	\N	f	2023-09-06 06:01:00	2025-07-23 13:35:58.585765
67	257	OS	172.16.17.143	172.16.17.143	\N	\N	\N	\N	WINWORD.EXE	\N	INFO	1	PDF opened via MS Word	\N	\N	\N	f	2023-09-06 06:01:00	2025-07-23 13:35:58.585765
68	257	DNS	172.16.17.143	172.16.17.143	\N	\N	\N	\N	msiexec.exe	\N	INFO	22	DNS query for web365metrics.com	\N	\N	\N	f	2023-09-06 06:01:00	2025-07-23 13:35:58.585765
69	257	OS	172.16.17.142	172.16.17.142	\N	\N	\N	\N	curl.exe	\N	INFO	11	Downloaded updates.rar using curl	\N	\N	\N	f	2023-10-12 13:35:00	2025-07-23 13:35:58.585765
70	257	Proxy	172.16.17.142	52.219.109.122	\N	\N	\N	\N	chrome.exe	\N	INFO	1	Downloaded updates_v2.7.2.zip	https://files-ld.s3.us-east-2.amazonaws.com/static/updates_v2.7.2.zip	\N	\N	f	2023-10-12 13:35:00	2025-07-23 13:35:58.585765
71	257	OS	172.16.17.142	172.16.17.142	\N	\N	\N	\N	7zG.exe	\N	INFO	11	Extracted updates_v2.7.2.bat	\N	\N	\N	f	2023-10-12 13:35:00	2025-07-23 13:35:58.585765
\.


--
-- Data for Name: severity_levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.severity_levels (severity_id, severity_level, severity_name, severity_description, color_code, response_time_sla, created_at) FROM stdin;
1	10	High	High severity phishing alert	#FF0000	\N	2025-07-23 13:34:46.083215
2	8	Medium	Repeated forced login attempts	#FFA500	\N	2025-07-23 13:34:46.083215
3	9	High	Detected exploitation attempt using CVE-2024-24919	#FF3300	\N	2025-07-23 13:34:46.083215
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, email, role, is_active, last_login, created_at, updated_at, password_hash, deleted_at) FROM stdin;
2	test	\N	SOC-L1	t	\N	2025-07-23 13:39:55.413798	2025-07-23 13:39:55.413798	$2b$10$VSeMzJLIbBJb1NeCRwalz.79urQnX2biPbCB0ocGBFl4/fMNJFMJW	\N
3	user2	\N	SOC-L1	t	\N	2025-08-19 15:17:43.937702	2025-08-19 15:17:43.937702	$2b$10$fQx97eAVtAli3W2uA7CoQOZMzr82sCLSsotUIogP8J9vJGA948Icu	\N
4	testuser	\N	SOC-L1	t	\N	2025-09-06 20:47:57.74179	2025-09-06 20:47:57.74179	$2b$10$vGBfgo/5l45sTaZA8PCQ/egfCsxnJav0Xudpqi7p6sc1AjTMIy3SK	\N
5	testuser2	\N	SOC-L1	t	\N	2025-09-06 21:57:46.907937	2025-09-06 21:57:46.907937	$2b$10$MbpkZjYHW3aWDy/V6qt5J.WPkwfwoloLdfJulaU1IMfbisqObdfnS	\N
1	deleted_user_1	1@deleted.local	SOC-L1	t	\N	2025-07-23 13:38:44.27111	2025-07-23 13:38:44.27111	delWeted	2025-10-23 15:10:28.010415+05:30
6	tsuki	\N	SOC-L1	t	\N	2025-10-23 15:10:58.369154	2025-10-23 15:10:58.369154	$2b$10$xZPUcbpBUSBbFG0YkDgEe.XERlSX01l0XbplVB6IR6qeNnmzC7oI.	\N
7	test1	\N	SOC-L1	t	\N	2025-10-23 15:11:36.753519	2025-10-23 15:11:36.753519	$2b$10$OU3nIoe27VV./D6iBUp0heRhCAoStuXnmRLSWoGhCVENXToNX3Ewe	\N
\.


--
-- Name: alert_details_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alert_details_detail_id_seq', 1, false);


--
-- Name: alert_investigations_investigation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alert_investigations_investigation_id_seq', 45, true);


--
-- Name: alert_types_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alert_types_type_id_seq', 1, false);


--
-- Name: alerts_alert_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alerts_alert_id_seq', 4, true);


--
-- Name: case_status_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.case_status_status_id_seq', 3, true);


--
-- Name: case_user_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.case_user_responses_id_seq', 9, true);


--
-- Name: cases_case_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cases_case_id_seq', 46, true);


--
-- Name: email_security_email_alert_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_security_email_alert_id_seq', 1, false);


--
-- Name: log_management_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.log_management_log_id_seq', 71, true);


--
-- Name: severity_levels_severity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.severity_levels_severity_id_seq', 1, false);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 7, true);


--
-- Name: alert_details alert_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_details
    ADD CONSTRAINT alert_details_pkey PRIMARY KEY (detail_id);


--
-- Name: alert_investigations alert_investigations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_investigations
    ADD CONSTRAINT alert_investigations_pkey PRIMARY KEY (investigation_id);


--
-- Name: alert_types alert_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_types
    ADD CONSTRAINT alert_types_pkey PRIMARY KEY (type_id);


--
-- Name: alert_types alert_types_type_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_types
    ADD CONSTRAINT alert_types_type_name_key UNIQUE (type_name);


--
-- Name: alerts alerts_event_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_event_id_key UNIQUE (event_id);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (alert_id);


--
-- Name: case_status case_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_status
    ADD CONSTRAINT case_status_pkey PRIMARY KEY (status_id);


--
-- Name: case_status case_status_status_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_status
    ADD CONSTRAINT case_status_status_name_key UNIQUE (status_name);


--
-- Name: case_user_responses case_user_responses_case_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_user_responses
    ADD CONSTRAINT case_user_responses_case_id_user_id_key UNIQUE (case_id, user_id);


--
-- Name: case_user_responses case_user_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_user_responses
    ADD CONSTRAINT case_user_responses_pkey PRIMARY KEY (id);


--
-- Name: cases cases_case_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_case_number_key UNIQUE (case_number);


--
-- Name: cases cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_pkey PRIMARY KEY (case_id);


--
-- Name: email_security email_security_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_security
    ADD CONSTRAINT email_security_pkey PRIMARY KEY (email_alert_id);


--
-- Name: log_management log_management_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_management
    ADD CONSTRAINT log_management_pkey PRIMARY KEY (log_id);


--
-- Name: severity_levels severity_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.severity_levels
    ADD CONSTRAINT severity_levels_pkey PRIMARY KEY (severity_id);


--
-- Name: severity_levels severity_levels_severity_level_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.severity_levels
    ADD CONSTRAINT severity_levels_severity_level_key UNIQUE (severity_level);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_alert_investigations_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_investigations_active ON public.alert_investigations USING btree (is_active);


--
-- Name: idx_alert_investigations_alert_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_investigations_alert_id ON public.alert_investigations USING btree (alert_id);


--
-- Name: idx_alert_investigations_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_investigations_user_id ON public.alert_investigations USING btree (user_id);


--
-- Name: idx_alerts_composite; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_composite ON public.alerts USING btree (severity_id, status, event_time);


--
-- Name: idx_alerts_destination_ip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_destination_ip ON public.alerts USING btree (destination_ip);


--
-- Name: idx_alerts_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_event_id ON public.alerts USING btree (event_id);


--
-- Name: idx_alerts_event_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_event_time ON public.alerts USING btree (event_time);


--
-- Name: idx_alerts_expected_result; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_expected_result ON public.alerts USING btree (expected_result);


--
-- Name: idx_alerts_is_closed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_is_closed ON public.alerts USING btree (is_closed);


--
-- Name: idx_alerts_severity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_severity ON public.alerts USING btree (severity_id);


--
-- Name: idx_alerts_source_ip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_source_ip ON public.alerts USING btree (source_ip);


--
-- Name: idx_alerts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_status ON public.alerts USING btree (status);


--
-- Name: idx_alerts_tags; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_tags ON public.alerts USING gin (tags);


--
-- Name: idx_alerts_user_assessment_correct; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alerts_user_assessment_correct ON public.alerts USING btree (user_assessment_correct);


--
-- Name: idx_cases_assigned_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cases_assigned_to ON public.cases USING btree (assigned_to);


--
-- Name: idx_cases_case_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cases_case_number ON public.cases USING btree (case_number);


--
-- Name: idx_cases_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cases_created_by ON public.cases USING btree (created_by);


--
-- Name: idx_cases_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cases_event_id ON public.cases USING btree (alert_id);


--
-- Name: idx_cases_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cases_status ON public.cases USING btree (status_id);


--
-- Name: idx_email_security_recipient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_security_recipient ON public.email_security USING btree (recipient_email);


--
-- Name: idx_email_security_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_security_sender ON public.email_security USING btree (sender_email);


--
-- Name: idx_email_security_subject; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_security_subject ON public.email_security USING btree (email_subject);


--
-- Name: idx_log_composite_ip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_composite_ip ON public.log_management USING btree (source_ip, destination_ip, log_time);


--
-- Name: idx_log_management_destination_ip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_management_destination_ip ON public.log_management USING btree (destination_ip);


--
-- Name: idx_log_management_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_management_event_id ON public.log_management USING btree (event_id);


--
-- Name: idx_log_management_log_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_management_log_source ON public.log_management USING btree (log_source);


--
-- Name: idx_log_management_log_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_management_log_time ON public.log_management USING btree (log_time);


--
-- Name: idx_log_management_parsed_fields; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_management_parsed_fields ON public.log_management USING gin (parsed_fields);


--
-- Name: idx_log_management_source_ip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_management_source_ip ON public.log_management USING btree (source_ip);


--
-- Name: unique_active_alert_owner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_active_alert_owner ON public.alert_investigations USING btree (alert_id) WHERE (is_active = true);


--
-- Name: cases generate_case_number_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER generate_case_number_trigger BEFORE INSERT ON public.cases FOR EACH ROW EXECUTE FUNCTION public.generate_case_number();


--
-- Name: alerts update_alerts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cases update_cases_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: alert_details alert_details_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_details
    ADD CONSTRAINT alert_details_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(alert_id) ON DELETE CASCADE;


--
-- Name: alert_investigations alert_investigations_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_investigations
    ADD CONSTRAINT alert_investigations_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(alert_id) ON DELETE CASCADE;


--
-- Name: alert_investigations alert_investigations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_investigations
    ADD CONSTRAINT alert_investigations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: alerts alerts_alert_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_alert_type_id_fkey FOREIGN KEY (alert_type_id) REFERENCES public.alert_types(type_id);


--
-- Name: alerts alerts_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.users(user_id);


--
-- Name: alerts alerts_severity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_severity_id_fkey FOREIGN KEY (severity_id) REFERENCES public.severity_levels(severity_id);


--
-- Name: case_user_responses case_user_responses_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_user_responses
    ADD CONSTRAINT case_user_responses_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.cases(case_id) ON DELETE CASCADE;


--
-- Name: case_user_responses case_user_responses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.case_user_responses
    ADD CONSTRAINT case_user_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: cases cases_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(alert_id);


--
-- Name: cases cases_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(user_id);


--
-- Name: cases cases_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: cases cases_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT cases_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.case_status(status_id);


--
-- Name: email_security email_security_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_security
    ADD CONSTRAINT email_security_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(alert_id) ON DELETE CASCADE;


--
-- Name: cases fk_cases_alert; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cases
    ADD CONSTRAINT fk_cases_alert FOREIGN KEY (alert_id) REFERENCES public.alerts(alert_id) ON DELETE CASCADE;


--
-- Name: log_management log_management_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_management
    ADD CONSTRAINT log_management_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.alerts(event_id);


--
-- PostgreSQL database dump complete
--

\unrestrict fdKtuFAavDPI2A4uAUURJoKS6vP3bAfHQOEvVS0HvLQT9n2KztCbagYhBsGlPuV

