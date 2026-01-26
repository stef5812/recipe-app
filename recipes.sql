--
-- PostgreSQL database dump
--

\restrict jaXCJ2bJKytdKnjczpVy5PapGy8IhxyryQcbbDpPlE6gUMchiGB3PonlTdmA3D4

-- Dumped from database version 16.11 (Debian 16.11-1.pgdg13+1)
-- Dumped by pg_dump version 16.11 (Debian 16.11-1.pgdg13+1)

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
-- Name: recipe_category; Type: TYPE; Schema: public; Owner: recipes
--

CREATE TYPE public.recipe_category AS ENUM (
    'ENTREE',
    'SOUP',
    'STARTER',
    'MAIN',
    'DESSERT',
    'CAKE',
    'SWEET'
);


ALTER TYPE public.recipe_category OWNER TO recipes;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: recipes
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO recipes;

--
-- Name: recipe_feedback; Type: TABLE; Schema: public; Owner: recipes
--

CREATE TABLE public.recipe_feedback (
    id bigint NOT NULL,
    recipe_id bigint NOT NULL,
    user_id bigint NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.recipe_feedback OWNER TO recipes;

--
-- Name: recipe_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: recipes
--

CREATE SEQUENCE public.recipe_feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recipe_feedback_id_seq OWNER TO recipes;

--
-- Name: recipe_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: recipes
--

ALTER SEQUENCE public.recipe_feedback_id_seq OWNED BY public.recipe_feedback.id;


--
-- Name: recipe_ingredients; Type: TABLE; Schema: public; Owner: recipes
--

CREATE TABLE public.recipe_ingredients (
    id bigint NOT NULL,
    recipe_id bigint NOT NULL,
    ingredient_name character varying(120) NOT NULL,
    amount numeric(10,2),
    unit character varying(20),
    note character varying(255),
    sort_order integer DEFAULT 1 NOT NULL,
    stage_name character varying(80),
    stage_number integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.recipe_ingredients OWNER TO recipes;

--
-- Name: recipe_ingredients_id_seq; Type: SEQUENCE; Schema: public; Owner: recipes
--

CREATE SEQUENCE public.recipe_ingredients_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recipe_ingredients_id_seq OWNER TO recipes;

--
-- Name: recipe_ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: recipes
--

ALTER SEQUENCE public.recipe_ingredients_id_seq OWNED BY public.recipe_ingredients.id;


--
-- Name: recipe_media; Type: TABLE; Schema: public; Owner: recipes
--

CREATE TABLE public.recipe_media (
    id bigint NOT NULL,
    recipe_id bigint NOT NULL,
    media_type character varying(10) NOT NULL,
    url text NOT NULL,
    caption character varying(255),
    is_primary boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 1 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.recipe_media OWNER TO recipes;

--
-- Name: recipe_media_id_seq; Type: SEQUENCE; Schema: public; Owner: recipes
--

CREATE SEQUENCE public.recipe_media_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recipe_media_id_seq OWNER TO recipes;

--
-- Name: recipe_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: recipes
--

ALTER SEQUENCE public.recipe_media_id_seq OWNED BY public.recipe_media.id;


--
-- Name: recipe_step_media; Type: TABLE; Schema: public; Owner: recipes
--

CREATE TABLE public.recipe_step_media (
    id bigint NOT NULL,
    step_id bigint NOT NULL,
    media_type character varying(10) NOT NULL,
    url text NOT NULL,
    caption character varying(255),
    sort_order integer DEFAULT 1 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.recipe_step_media OWNER TO recipes;

--
-- Name: recipe_step_media_id_seq; Type: SEQUENCE; Schema: public; Owner: recipes
--

CREATE SEQUENCE public.recipe_step_media_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recipe_step_media_id_seq OWNER TO recipes;

--
-- Name: recipe_step_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: recipes
--

ALTER SEQUENCE public.recipe_step_media_id_seq OWNED BY public.recipe_step_media.id;


--
-- Name: recipe_steps; Type: TABLE; Schema: public; Owner: recipes
--

CREATE TABLE public.recipe_steps (
    id bigint NOT NULL,
    recipe_id bigint NOT NULL,
    step_number integer NOT NULL,
    instruction text NOT NULL
);


ALTER TABLE public.recipe_steps OWNER TO recipes;

--
-- Name: recipe_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: recipes
--

CREATE SEQUENCE public.recipe_steps_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recipe_steps_id_seq OWNER TO recipes;

--
-- Name: recipe_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: recipes
--

ALTER SEQUENCE public.recipe_steps_id_seq OWNED BY public.recipe_steps.id;


--
-- Name: recipes; Type: TABLE; Schema: public; Owner: recipes
--

CREATE TABLE public.recipes (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    source character varying(255),
    name character varying(120) NOT NULL,
    description text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    category public.recipe_category,
    country character varying(80) DEFAULT 'Not known'::character varying NOT NULL
);


ALTER TABLE public.recipes OWNER TO recipes;

--
-- Name: recipes_id_seq; Type: SEQUENCE; Schema: public; Owner: recipes
--

CREATE SEQUENCE public.recipes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recipes_id_seq OWNER TO recipes;

--
-- Name: recipes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: recipes
--

ALTER SEQUENCE public.recipes_id_seq OWNED BY public.recipes.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: recipes
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    username character varying(50) NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_admin boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO recipes;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: recipes
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO recipes;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: recipes
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: recipe_feedback id; Type: DEFAULT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_feedback ALTER COLUMN id SET DEFAULT nextval('public.recipe_feedback_id_seq'::regclass);


--
-- Name: recipe_ingredients id; Type: DEFAULT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_ingredients ALTER COLUMN id SET DEFAULT nextval('public.recipe_ingredients_id_seq'::regclass);


--
-- Name: recipe_media id; Type: DEFAULT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_media ALTER COLUMN id SET DEFAULT nextval('public.recipe_media_id_seq'::regclass);


--
-- Name: recipe_step_media id; Type: DEFAULT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_step_media ALTER COLUMN id SET DEFAULT nextval('public.recipe_step_media_id_seq'::regclass);


--
-- Name: recipe_steps id; Type: DEFAULT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_steps ALTER COLUMN id SET DEFAULT nextval('public.recipe_steps_id_seq'::regclass);


--
-- Name: recipes id; Type: DEFAULT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipes ALTER COLUMN id SET DEFAULT nextval('public.recipes_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: recipes
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
674cfe60-1bbf-4304-884e-248a7a4357f1	b1b1977803db7a9ff9bcb8d6931738462b1523fbd9f6a63fd0c5dae97a235b3f	2026-01-25 22:09:50.18653+00	20260124130441_init	\N	\N	2026-01-25 22:09:50.06678+00	1
70c3db96-3d3e-4dd1-b58f-ea41b6efe1ba	6b2034702487ce4186b2f14b4f4c438dffc0b87a8b2dcb578c581a32edfdf79a	2026-01-25 22:09:50.204637+00	20260124152340_add_country_category_to_recipes	\N	\N	2026-01-25 22:09:50.189336+00	1
c99ed054-f49e-4a83-a3c6-5554f47326fe	ab3becd84759e4398133063006d3fd53d83678020680126605122d9f5679421d	2026-01-25 22:09:50.214003+00	20260124210911_add_ingredient_stages	\N	\N	2026-01-25 22:09:50.206586+00	1
\.


--
-- Data for Name: recipe_feedback; Type: TABLE DATA; Schema: public; Owner: recipes
--

COPY public.recipe_feedback (id, recipe_id, user_id, rating, comment, created_at) FROM stdin;
\.


--
-- Data for Name: recipe_ingredients; Type: TABLE DATA; Schema: public; Owner: recipes
--

COPY public.recipe_ingredients (id, recipe_id, ingredient_name, amount, unit, note, sort_order, stage_name, stage_number) FROM stdin;
3	3	Butter	57.00	Grams	or 2 oz	1	\N	1
5	3	Pineapple	1.00	Tin	Or use real pinapple, always best	3	\N	1
6	3	Self raising flour	0.25	Kg	Or use flour with good teaspoon of baking powder	4	\N	1
7	3	Salt	0.25	Tsp	Or a pinch of salt	5	\N	1
8	3	Butter	125.00	Gr	Or a Qtr lb	6	\N	1
9	3	Sugar	125.00	Grams	This can be white sugar	7	\N	1
4	3	Brown sugar	57.00	Grams	(or 2 oz) Brown because it caremelises	2	\N	1
10	3	Lemon Peel	1.00	Lemon	Grated, really adds another taste to the cake..	8	\N	1
11	3	Eggs	2.00	Large	Large or medium	9	\N	1
12	3	Milk	5.00	Tbsp	Instructions say 4-5, depending....	10	\N	1
13	4	Pork Belly	2.00	Pork bellies	Can be Beef or pork or both or even just lardons Quantity depending on cooks discretion	1	\N	1
14	4	Onions	2.00	Onions	Chopped or sliced, again Qty depend on previous ingredient	2	\N	1
15	4	Garlic	2.00	Cloves	Crushed or chopped	3	\N	1
16	4	Tomatoes	4.00	Tomatoes	Could be Puree with added water, Qty Depending, but should be enough for sauce...	4	\N	1
17	4	Peppers	1.00	Green or red	Sliced or chopped	5	\N	1
18	4	Salt	1.00	Pinch	Cooks discretion	6	\N	1
19	4	Paprika	2.00	Tbsp	1-2 Tbsp	7	\N	1
20	4	Caraway seeds	1.00	Sprinkling	This is what adds something to the taste. Don't add too much though	8	\N	1
21	4	Thyme or Marjoram	1.00	Sprinkling	\N	9	\N	1
22	5	Spare ribs or pork Belly	4.00	Cuts	Depends on cooks discretion	1	\N	1
23	5	Carrots	4.00	Large Carrots	Should be equal to amount of meat	2	\N	1
24	5	Potatoes	4.00	Large Potatoes	Again, equal to previous quantity	3	\N	1
25	5	Flour	1.00	Tbsp	To make a Roux or bechamel to add to thicken the stew	4	\N	1
26	6	Onion	1.00	Onion	Chopped	1	\N	1
27	6	Red Cabbage	1.00	Whole	\N	2	\N	1
28	6	Cloves	7.00	Cloves	Recipe says 5-9 cloves	3	\N	1
29	6	Prunes	7.00	Prunes	Recipe says 5-9	4	\N	1
30	6	Apple	1.00	Apple sliced	\N	5	\N	1
31	6	Salt	1.00	Pinch	\N	6	\N	1
32	6	Sugar	50.00	Grams	This quantity varies	7	\N	1
33	6	Lemon Juice	1.00	Tbsp	\N	8	\N	1
34	7	Chicken	1.00	Whole	Needing a pot that can hold the chicken	1	\N	1
35	7	Peanuts or Peanut butter	2.00	Heaped Rbsp	Most times we use Peanut utter but if real peanuts available, cooks discretion	2	\N	1
36	7	Coconut milk	1.00	Tin	Add everything from the tin	3	\N	1
37	7	Onion	1.00	Large	\N	4	\N	1
38	7	Garlic	4.00	cloves	Recipe says between 3-4	5	\N	1
39	7	Red bonnet	1.00	Left whole	If no red bonnet, little round green and yellow chillies	6	\N	1
40	7	Chicken stock or cube	1.00	cube	Make the stock or with water mixed with cube	7	\N	1
41	7	Tomatoe or Puree	2.00	Tomatoes	Or a squirt of Puree	8	\N	1
42	7	Salt and pepper	1.00	grind of each	Or at cooks discretion	9	\N	1
\.


--
-- Data for Name: recipe_media; Type: TABLE DATA; Schema: public; Owner: recipes
--

COPY public.recipe_media (id, recipe_id, media_type, url, caption, is_primary, sort_order, created_at) FROM stdin;
2	3	image	/uploads/1769430999324-Pineapple_Upside-Down_Cake.jpg	\N	t	1	2026-01-26 12:36:39.337+00
3	4	image	/uploads/1769431762625-Hungarian-Goulash-_6.jpg	\N	t	1	2026-01-26 12:49:22.634+00
4	5	image	/uploads/1769432171780-carrot-stew.jpg	\N	t	1	2026-01-26 12:56:11.795+00
5	6	image	/uploads/1769432567956-Red-cabbage.jpg	\N	t	1	2026-01-26 13:02:47.962+00
6	7	image	/uploads/1769433347391-Chicken-Groundnut.jpg	\N	t	1	2026-01-26 13:15:47.401+00
\.


--
-- Data for Name: recipe_step_media; Type: TABLE DATA; Schema: public; Owner: recipes
--

COPY public.recipe_step_media (id, step_id, media_type, url, caption, sort_order, created_at) FROM stdin;
\.


--
-- Data for Name: recipe_steps; Type: TABLE DATA; Schema: public; Owner: recipes
--

COPY public.recipe_steps (id, recipe_id, step_number, instruction) FROM stdin;
3	3	1	Melt butter, stir in sugar.
4	3	2	Pour in bottom of 2 pint buttered pie dish (or cake tin).
5	3	3	Arrange pineapple-rings over bottom and side.
6	3	4	Sift Flour, baking powder and  salt and rub in butter finely
7	3	5	add sugar + lemon peel. Toss ingredients lightly together, mix to fairly soft batter with eggs + milk.
8	3	6	Put in pie-dish (cake tin) and bake in centre of oven (gas No.5) for 30 minutes.
9	3	7	Then for 35-45 minutes (Gas No.4).
10	3	8	Leave on dish 5 minutes.
11	3	9	Turn out onto warm plate. Serve with fresh double cream or pine-apple juice warmed up.
12	4	1	Fry cut up meat in biggish pan with onions and garlic, not for too long.
13	4	2	Add tomatoes, peppers cut up.
14	4	3	When softish, add a bit of tomato puree (not nec.), water, paprika (1-2 tbsp), salt, caraway seed, thyme and/or majoran.
15	4	4	Later add pepper.
16	4	5	Goes well with potatoes or pasta
17	5	1	Fry ribs lightly in a little fat
18	5	2	add a lot of cut-up carrots
19	5	3	Ribs, Carrots, salt and water to a saucepan and bring to boil
20	5	4	later add peppers
21	5	5	Then fry a tablespoon of flour in pan used for ribs till light brown and add to boiling stew.
22	6	1	Fry onion
23	6	2	add sliced up cabbage and a little water.
24	6	3	Then add salt, sugar, lemon juice and 5-9 cloves, depending on the size of the cabbage.
25	6	4	After about 15 minutes add 5-9 prunes (dried plums) and a sliced apple.
26	6	5	Cook gently until soft.
27	7	1	Steam chicken
28	7	2	Grate peanuts or use peanutbutter , mix wit water to paste
29	7	3	Make coconutmilk (when you are in Africa, when not, take tin of coconut).
30	7	4	Separately fry onion and garlic gently
31	7	5	add chicken stock, peanut paste, pepper, and tomatoes/puree
32	7	6	Cook slowly for a short while, then add chicken and coconut milk
33	7	7	Cook again slowly, season and serve with rice or mashed potatoes.
\.


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: recipes
--

COPY public.recipes (id, user_id, source, name, description, created_at, updated_at, category, country) FROM stdin;
3	1	Mum	Pineapple Upside down cake	A favourite of ours as kids	2026-01-26 12:26:23.811+00	2026-01-26 12:26:23.811+00	CAKE	Germany
4	1	Mum	Hungarian Goulash	Very nice dish picked up along the way	2026-01-26 12:39:42.452+00	2026-01-26 12:39:42.452+00	MAIN	Hungary
5	1	Mum	Carrot stew	Nice on cold days	2026-01-26 12:49:55.437+00	2026-01-26 12:49:55.437+00	MAIN	Not known
6	1	Mum	Red Cabbage	Red cabbage to go well with Pork	2026-01-26 12:56:57.5+00	2026-01-26 12:56:57.5+00	MAIN	Not known
7	1	Dad	Chicken Ground nut stew	Wow, sweet and spicey. Another great thing to come out of Africa	2026-01-26 13:07:54.69+00	2026-01-26 13:07:54.69+00	MAIN	Africa
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: recipes
--

COPY public.users (id, username, password_hash, created_at, is_admin) FROM stdin;
1	stefandodds@hotmail.com	$2b$12$Ds2lIuPhhV8xxAuaXZ6Nm.HE60qPPI2ha651gv4KO5iN1KR1aDIei	2026-01-25 22:40:53.978+00	f
2	admin	$2b$10$iKZdTj56mpyJGhz.AhPn4uUxsMQUkYRlWJ9YhixXdlquwyUbZ0R1G	2026-01-26 12:23:40.471+00	t
\.


--
-- Name: recipe_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: recipes
--

SELECT pg_catalog.setval('public.recipe_feedback_id_seq', 1, false);


--
-- Name: recipe_ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: recipes
--

SELECT pg_catalog.setval('public.recipe_ingredients_id_seq', 42, true);


--
-- Name: recipe_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: recipes
--

SELECT pg_catalog.setval('public.recipe_media_id_seq', 6, true);


--
-- Name: recipe_step_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: recipes
--

SELECT pg_catalog.setval('public.recipe_step_media_id_seq', 1, false);


--
-- Name: recipe_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: recipes
--

SELECT pg_catalog.setval('public.recipe_steps_id_seq', 33, true);


--
-- Name: recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: recipes
--

SELECT pg_catalog.setval('public.recipes_id_seq', 7, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: recipes
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: recipe_feedback recipe_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_feedback
    ADD CONSTRAINT recipe_feedback_pkey PRIMARY KEY (id);


--
-- Name: recipe_ingredients recipe_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_pkey PRIMARY KEY (id);


--
-- Name: recipe_media recipe_media_pkey; Type: CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_media
    ADD CONSTRAINT recipe_media_pkey PRIMARY KEY (id);


--
-- Name: recipe_step_media recipe_step_media_pkey; Type: CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_step_media
    ADD CONSTRAINT recipe_step_media_pkey PRIMARY KEY (id);


--
-- Name: recipe_steps recipe_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_steps
    ADD CONSTRAINT recipe_steps_pkey PRIMARY KEY (id);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_feedback_recipe_id; Type: INDEX; Schema: public; Owner: recipes
--

CREATE INDEX idx_feedback_recipe_id ON public.recipe_feedback USING btree (recipe_id);


--
-- Name: idx_feedback_user_id; Type: INDEX; Schema: public; Owner: recipes
--

CREATE INDEX idx_feedback_user_id ON public.recipe_feedback USING btree (user_id);


--
-- Name: idx_ingredients_recipe_id; Type: INDEX; Schema: public; Owner: recipes
--

CREATE INDEX idx_ingredients_recipe_id ON public.recipe_ingredients USING btree (recipe_id);


--
-- Name: idx_recipe_media_primary; Type: INDEX; Schema: public; Owner: recipes
--

CREATE INDEX idx_recipe_media_primary ON public.recipe_media USING btree (recipe_id, is_primary);


--
-- Name: idx_recipe_media_recipe_id; Type: INDEX; Schema: public; Owner: recipes
--

CREATE INDEX idx_recipe_media_recipe_id ON public.recipe_media USING btree (recipe_id);


--
-- Name: idx_recipes_user_id; Type: INDEX; Schema: public; Owner: recipes
--

CREATE INDEX idx_recipes_user_id ON public.recipes USING btree (user_id);


--
-- Name: idx_step_media_step_id; Type: INDEX; Schema: public; Owner: recipes
--

CREATE INDEX idx_step_media_step_id ON public.recipe_step_media USING btree (step_id);


--
-- Name: idx_steps_recipe_id; Type: INDEX; Schema: public; Owner: recipes
--

CREATE INDEX idx_steps_recipe_id ON public.recipe_steps USING btree (recipe_id);


--
-- Name: uq_feedback_one_per_user; Type: INDEX; Schema: public; Owner: recipes
--

CREATE UNIQUE INDEX uq_feedback_one_per_user ON public.recipe_feedback USING btree (recipe_id, user_id);


--
-- Name: uq_recipe_step; Type: INDEX; Schema: public; Owner: recipes
--

CREATE UNIQUE INDEX uq_recipe_step ON public.recipe_steps USING btree (recipe_id, step_number);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: recipes
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: recipe_feedback recipe_feedback_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_feedback
    ADD CONSTRAINT recipe_feedback_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;


--
-- Name: recipe_feedback recipe_feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_feedback
    ADD CONSTRAINT recipe_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: recipe_ingredients recipe_ingredients_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;


--
-- Name: recipe_media recipe_media_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_media
    ADD CONSTRAINT recipe_media_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;


--
-- Name: recipe_step_media recipe_step_media_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_step_media
    ADD CONSTRAINT recipe_step_media_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.recipe_steps(id) ON DELETE CASCADE;


--
-- Name: recipe_steps recipe_steps_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipe_steps
    ADD CONSTRAINT recipe_steps_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;


--
-- Name: recipes recipes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: recipes
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict jaXCJ2bJKytdKnjczpVy5PapGy8IhxyryQcbbDpPlE6gUMchiGB3PonlTdmA3D4

