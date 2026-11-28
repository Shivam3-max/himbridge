CREATE TABLE "service_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"service" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sourcing_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"spec" text DEFAULT '' NOT NULL,
	"reference_url" text DEFAULT '' NOT NULL,
	"quantity" integer NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"current_price" numeric(14, 2),
	"target_price" numeric(14, 2),
	"retail_price" numeric(14, 2)
);
--> statement-breakpoint
CREATE TABLE "sourcing_message" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"author_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sourcing_offer" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"vendor_id" text NOT NULL,
	"moq" integer NOT NULL,
	"lead_days" integer NOT NULL,
	"sample_price" numeric(14, 2),
	"sample_days" integer,
	"note" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sourcing_offer_line" (
	"offer_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	CONSTRAINT "sourcing_offer_line_offer_id_item_id_pk" PRIMARY KEY("offer_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "sourcing_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text,
	"buyer_id" text NOT NULL,
	"kind" text NOT NULL,
	"niche" text NOT NULL,
	"title" text NOT NULL,
	"brief" text DEFAULT '' NOT NULL,
	"store_url" text DEFAULT '' NOT NULL,
	"destination" text NOT NULL,
	"deliver_by" date,
	"shipping" text DEFAULT 'advise' NOT NULL,
	"terms" text DEFAULT 'DDP' NOT NULL,
	"reorder" text DEFAULT 'one_off' NOT NULL,
	"samples_needed" boolean DEFAULT true NOT NULL,
	"private_label" boolean DEFAULT false NOT NULL,
	"custom_packaging" boolean DEFAULT false NOT NULL,
	"stage" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sourcing_request_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "vendor_compliance" (
	"vendor_id" text NOT NULL,
	"item_key" text NOT NULL,
	"status" text DEFAULT 'missing' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"expires_on" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_compliance_vendor_id_item_key_pk" PRIMARY KEY("vendor_id","item_key")
);
--> statement-breakpoint
ALTER TABLE "trade_order" ADD COLUMN "sourcing_id" integer;--> statement-breakpoint
ALTER TABLE "rfq" ADD COLUMN "incoterm" text DEFAULT 'FOB' NOT NULL;--> statement-breakpoint
ALTER TABLE "rfq" ADD COLUMN "deliver_by" date;--> statement-breakpoint
ALTER TABLE "rfq" ADD COLUMN "samples_needed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "buyer_type" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_request" ADD CONSTRAINT "service_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_item" ADD CONSTRAINT "sourcing_item_request_id_sourcing_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."sourcing_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_message" ADD CONSTRAINT "sourcing_message_request_id_sourcing_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."sourcing_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_message" ADD CONSTRAINT "sourcing_message_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_offer" ADD CONSTRAINT "sourcing_offer_request_id_sourcing_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."sourcing_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_offer" ADD CONSTRAINT "sourcing_offer_vendor_id_user_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_offer_line" ADD CONSTRAINT "sourcing_offer_line_offer_id_sourcing_offer_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."sourcing_offer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_offer_line" ADD CONSTRAINT "sourcing_offer_line_item_id_sourcing_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."sourcing_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_request" ADD CONSTRAINT "sourcing_request_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_compliance" ADD CONSTRAINT "vendor_compliance_vendor_id_user_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_request_user_idx" ON "service_request" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "service_request_status_idx" ON "service_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sourcing_item_req_idx" ON "sourcing_item" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "sourcing_message_req_idx" ON "sourcing_message" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sourcing_offer_req_vendor_uq" ON "sourcing_offer" USING btree ("request_id","vendor_id");--> statement-breakpoint
CREATE INDEX "sourcing_buyer_idx" ON "sourcing_request" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "sourcing_stage_idx" ON "sourcing_request" USING btree ("stage");--> statement-breakpoint
ALTER TABLE "trade_order" ADD CONSTRAINT "trade_order_sourcing_id_sourcing_request_id_fk" FOREIGN KEY ("sourcing_id") REFERENCES "public"."sourcing_request"("id") ON DELETE set null ON UPDATE no action;