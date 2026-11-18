import { PartnerAddressController } from "@/src/controllers/PartnerAddressController";
export const runtime = "nodejs";
export const GET = PartnerAddressController.list;
export const POST = PartnerAddressController.create;
