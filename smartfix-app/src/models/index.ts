import { Client } from "./Client";
import { ClientAddress } from "./ClientAddress";
import { ClientDevice } from "./ClientDevice";
import { Partner } from "./Partner";

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

export { Client, ClientAddress, ClientDevice, Partner };
