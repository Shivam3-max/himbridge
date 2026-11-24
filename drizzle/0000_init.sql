CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_outbox" (
	"id" serial PRIMARY KEY NOT NULL,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'logged' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"kind" text NOT NULL,
	"ref_id" integer,
	"label" text DEFAULT '' NOT NULL,
	"name" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"storage_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "file_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "milestone" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"status" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notice" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"tag" text DEFAULT 'Notice' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_order" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text,
	"rfq_id" integer,
	"quote_id" integer,
	"buyer_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"logistics_id" text,
	"title" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	"destination" text DEFAULT '' NOT NULL,
	"incoterm" text DEFAULT 'FOB' NOT NULL,
	"mode" text DEFAULT '' NOT NULL,
	"origin_port" text DEFAULT '' NOT NULL,
	"dest_port" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trade_order_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"stage" text NOT NULL,
	"pct" integer NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"status" text DEFAULT 'due' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"confirmed_by_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" text NOT NULL,
	"niche" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"hs_code" text DEFAULT '' NOT NULL,
	"moq" integer NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"price_min" numeric(14, 2) NOT NULL,
	"price_max" numeric(14, 2) NOT NULL,
	"lead_days" integer NOT NULL,
	"material" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_price_range" CHECK ("product"."price_max" >= "product"."price_min")
);
--> statement-breakpoint
CREATE TABLE "quote" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfq_id" integer NOT NULL,
	"vendor_id" text NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"lead_days" integer NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfq" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyer_id" text NOT NULL,
	"niche" text NOT NULL,
	"title" text NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"quantity" integer NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"destination" text NOT NULL,
	"target_price" numeric(14, 2),
	"origin_pref" text DEFAULT 'ANY' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'buyer' NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendor_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"origin" text NOT NULL,
	"cluster" text DEFAULT '' NOT NULL,
	"niche" text NOT NULL,
	"certifications" text DEFAULT '' NOT NULL,
	"capacity" text DEFAULT '' NOT NULL,
	"years" integer DEFAULT 0 NOT NULL,
	"about" text DEFAULT '' NOT NULL,
	"verification" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone" ADD CONSTRAINT "milestone_order_id_trade_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."trade_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestone" ADD CONSTRAINT "milestone_by_user_id_user_id_fk" FOREIGN KEY ("by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_order" ADD CONSTRAINT "trade_order_rfq_id_rfq_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfq"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_order" ADD CONSTRAINT "trade_order_quote_id_quote_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quote"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_order" ADD CONSTRAINT "trade_order_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_order" ADD CONSTRAINT "trade_order_vendor_id_user_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_order" ADD CONSTRAINT "trade_order_logistics_id_user_id_fk" FOREIGN KEY ("logistics_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_trade_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."trade_order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_confirmed_by_id_user_id_fk" FOREIGN KEY ("confirmed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_vendor_id_user_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_rfq_id_rfq_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfq"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_vendor_id_user_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_profile" ADD CONSTRAINT "vendor_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "file_kind_ref_idx" ON "file" USING btree ("kind","ref_id");--> statement-breakpoint
CREATE INDEX "file_owner_idx" ON "file" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "milestone_order_idx" ON "milestone" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_buyer_idx" ON "trade_order" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "order_vendor_idx" ON "trade_order" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "order_logistics_idx" ON "trade_order" USING btree ("logistics_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_order_stage_uq" ON "payment" USING btree ("order_id","stage");--> statement-breakpoint
CREATE INDEX "product_vendor_idx" ON "product" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "product_niche_idx" ON "product" USING btree ("niche");--> statement-breakpoint
CREATE UNIQUE INDEX "quote_rfq_vendor_uq" ON "quote" USING btree ("rfq_id","vendor_id");--> statement-breakpoint
CREATE INDEX "rfq_buyer_idx" ON "rfq" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "rfq_status_idx" ON "rfq" USING btree ("status");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "vendor_verification_idx" ON "vendor_profile" USING btree ("verification");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");