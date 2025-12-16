--
-- PostgreSQL database dump
--

-- Dumped from database version 16.11 (b740647)
-- Dumped by pg_dump version 16.3

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL
);


ALTER TABLE public.admins OWNER TO neondb_owner;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.admins ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.admins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: barracks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.barracks (
    id integer NOT NULL,
    name text NOT NULL,
    location text NOT NULL,
    photo_url text,
    verified boolean DEFAULT false NOT NULL,
    pic_id integer
);


ALTER TABLE public.barracks OWNER TO neondb_owner;

--
-- Name: barracks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.barracks ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.barracks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.inventory (
    id integer NOT NULL,
    barack_id integer NOT NULL,
    item_name text NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'APBN'::text NOT NULL
);


ALTER TABLE public.inventory OWNER TO neondb_owner;

--
-- Name: inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.inventory ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.inventory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.members (
    id integer NOT NULL,
    barack_id integer NOT NULL,
    name text NOT NULL,
    rank text,
    role text
);


ALTER TABLE public.members OWNER TO neondb_owner;

--
-- Name: members_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.members ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: pics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pics (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    name text NOT NULL,
    rank text,
    photo_url text
);


ALTER TABLE public.pics OWNER TO neondb_owner;

--
-- Name: pics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.pics ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.pics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admins (id, username, password_hash) FROM stdin;
1	admin	$2b$10$NxnQSEuj8z8zpr2D1azKseTNooUSaZ.w7HWUDPu9BL546YtOBCkd2
\.


--
-- Data for Name: barracks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.barracks (id, name, location, photo_url, verified, pic_id) FROM stdin;
3	Charlie Platoon Quarters	Building 308, Camp Pendleton	/uploads/e64538b5-f542-4d92-9cf9-69944f816c70.jpg	f	4
9	Test Visibility Barrack W3JlDm	Test Location	/generated_images/Contemporary_barracks_complex_2e44b7c9.png	f	6
14	Charlie Platoon Quarters	Komp. TNI AD, Daya, Makassar	/generated_images/Modern_military_barrack_building_fcae3325.png	f	7
13	Predefined Photo Test CHFUjr	Test Location	/generated_images/Modern_military_barrack_building_fcae3325.png	f	\N
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.inventory (id, barack_id, item_name, quantity, status) FROM stdin;
18	14	fdfd	1	Swadaya
19	13	gfgfgff	1	APBN
7	3	Boots	65	APBN
8	3	Flashlights	30	APBN
\.


--
-- Data for Name: members; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.members (id, barack_id, name, rank, role) FROM stdin;
18	14	fdfd	fdf	fdf
8	3	Matthew Harris	Lieutenant	Platoon Leader
9	3	Emily Clark	Sergeant First Class	Operations NCO
10	3	Joshua Lewis	Specialist	Communications
16	3	ali abdal	\N	\N
\.


--
-- Data for Name: pics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pics (id, username, password_hash, name, rank, photo_url) FROM stdin;
1	pic1	$2b$10$HZILnP.MJ0SIxk190K4EgebKMuOP7mrjCgOGCrS6iLH1UR8v3SgxG	John Smith	Colonel	\N
2	pic2	$2b$10$ekeU6vEN7sW7I.vcib3YI.wAuP79.EljFISybX6eaOsQEBDHSH2ty	Sarah Johnson	Major	\N
3	TestPICFLp6Vs	$2b$10$TdFFC4HZ9aY6dmOzUNsP3.p4aERNXhAP0/MIKPiLya61DKjTnCU3y	TestPICFLp6Vs	\N	\N
4	John Smith	$2b$10$Wx2DIX.jRxsyCjdC1k/TNuE.LCcQgGlYEqpaXTJAju8RtqvSuyAOS	John Smith	\N	\N
5	Sarah Johnson	$2b$10$1bH3ZZVdIwghLSpaBvThOOvtUahSneRX1DZ1SiGlXJ7EAGB2lvKu6	Sarah Johnson	\N	\N
6	TestPICkQlHTX	$2b$10$19Z3RGq8EJJdpadhFiZWsuV7swdT6f9D2J6ntiZmXTNAUU1bUx.gO	TestPICkQlHTX	\N	\N
7	fdf	$2b$10$N3W4FC7d1KRuJ9I9xlJ3buGDfqQtZguJb8XaKrkjW7ueaJGkgGf6.	fdf	\N	\N
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, true);


--
-- Name: barracks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.barracks_id_seq', 17, true);


--
-- Name: inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.inventory_id_seq', 19, true);


--
-- Name: members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.members_id_seq', 18, true);


--
-- Name: pics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pics_id_seq', 7, true);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins admins_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_unique UNIQUE (username);


--
-- Name: barracks barracks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.barracks
    ADD CONSTRAINT barracks_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: pics pics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pics
    ADD CONSTRAINT pics_pkey PRIMARY KEY (id);


--
-- Name: pics pics_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pics
    ADD CONSTRAINT pics_username_unique UNIQUE (username);


--
-- Name: barracks barracks_pic_id_pics_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.barracks
    ADD CONSTRAINT barracks_pic_id_pics_id_fk FOREIGN KEY (pic_id) REFERENCES public.pics(id);


--
-- Name: inventory inventory_barack_id_barracks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_barack_id_barracks_id_fk FOREIGN KEY (barack_id) REFERENCES public.barracks(id) ON DELETE CASCADE;


--
-- Name: members members_barack_id_barracks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_barack_id_barracks_id_fk FOREIGN KEY (barack_id) REFERENCES public.barracks(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

