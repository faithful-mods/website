-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "user_reporter_id" TEXT NOT NULL,
    "user_reported_id" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reportReasonId" TEXT NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_reasons" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "report_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_reasons_value_key" ON "report_reasons"("value");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_reporter_id_fkey" FOREIGN KEY ("user_reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_reported_id_fkey" FOREIGN KEY ("user_reported_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportReasonId_fkey" FOREIGN KEY ("reportReasonId") REFERENCES "report_reasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
