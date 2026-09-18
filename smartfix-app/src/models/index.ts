import { Client } from "./Client";
import { ClientAddress } from "./ClientAddress";
import { ClientDevice } from "./ClientDevice";
import { Partner } from "./Partner";
import { PartnerService } from "./PartnerService";
import { RepairOrderModel } from "./RepairOrder";
import { Review } from "./Review";

Client.hasMany(ClientAddress, {
  foreignKey: "client_id",
  as: "addresses",
});
ClientAddress.belongsTo(Client, {
  foreignKey: "client_id",
  as: "client",
});

Client.hasMany(ClientDevice, {
  foreignKey: "client_id",
  as: "devices",
});
ClientDevice.belongsTo(Client, {
  foreignKey: "client_id",
  as: "client",
});

Partner.hasMany(ClientAddress, { foreignKey: "partner_id", as: "addresses" });
ClientAddress.belongsTo(Partner, { foreignKey: "partner_id", as: "partner" });

Client.hasMany(RepairOrderModel, { foreignKey: "client_id", as: "orders" });
Partner.hasMany(RepairOrderModel, { foreignKey: "partner_id", as: "orders" });
ClientDevice.hasMany(RepairOrderModel, { foreignKey: "device_id", as: "orders" });
RepairOrderModel.belongsTo(Client, { foreignKey: "client_id", as: "client" });
RepairOrderModel.belongsTo(Partner, { foreignKey: "partner_id", as: "partner" });
RepairOrderModel.belongsTo(ClientDevice, { foreignKey: "device_id", as: "device" });
RepairOrderModel.hasOne(Review, { foreignKey: "repair_order_id", as: "review" });
Review.belongsTo(RepairOrderModel, { foreignKey: "repair_order_id", as: "order" });
Client.hasMany(Review, { foreignKey: "client_id", as: "reviews" });
Partner.hasMany(Review, { foreignKey: "partner_id", as: "reviews" });
Partner.hasMany(PartnerService, { foreignKey: "partner_id", as: "services" });
PartnerService.belongsTo(Partner, { foreignKey: "partner_id", as: "partner" });

export { Client, ClientAddress, ClientDevice, Partner, PartnerService, RepairOrderModel, Review };
