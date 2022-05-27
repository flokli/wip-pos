import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { isUserInTeam } from "./accounts";
import Locations, { ILocation } from "./locations";
import Products, { IProduct } from "./products";

export interface ISale {
  _id: string;
  userId?: string;
  locationId: string;
  currency?: string;
  country?: string;
  amount: number;
  timestamp: Date;
  products: IProduct[];
}

const Sales = new Mongo.Collection<ISale>("sales");

if (Meteor.isServer)
  Meteor.startup(() => {
    if (Sales.find().count() === 0) {
      Sales.insert({
        timestamp: new Date(),
        amount: 0,
        locationId: Locations.findOne({ slug: "bar" })!._id,
        products: [
          {
            createdAt: new Date(),
            _id: "blahh",
            brandName: "the abrand",
            name: "some rodut",
          },
        ],
      });
    }
    if (Sales.find({ locationId: { $exists: false } }).count()) {
      console.log(
        "Setting any Sale without locationId's locationId to the bar.",
      );
      Sales.update(
        { locationId: { $exists: false } },
        { $set: { locationId: Locations.findOne({ slug: "bar" })!._id } },
        { multi: true },
      );
    }
  });

Meteor.methods({
  "Sales.sellProducts"({
    locationSlug,
    productIds,
  }: {
    locationSlug: ILocation["slug"];
    productIds: IProduct["_id"][];
  }) {
    if (this.isSimulation) return;
    if (!locationSlug || !productIds) throw new Meteor.Error("misisng");
    const { userId } = this;
    if (!userId) throw new Meteor.Error("log in please");
    const location = Locations.findOne({ slug: locationSlug });
    if (!location) throw new Meteor.Error("invalid location");

    if (!isUserInTeam(userId, location.teamName))
      throw new Meteor.Error("Wait that's illegal");

    const newSale = {
      userId,
      locationId: location._id,
      currency: "HAX",
      country: "DK",
      amount: productIds.reduce(
        (m: number, _id) => m + Number(Products.findOne({ _id })?.salePrice),
        0,
      ),
      timestamp: new Date(),
      products: productIds.map((_id) => Products.findOne({ _id })!),
    };
    return Sales.insert(newSale);
  },
});

export default Sales;

//@ts-expect-error
if (Meteor.isClient) window.Sales = Sales;