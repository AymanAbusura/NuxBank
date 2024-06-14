"use server";

import { Client } from "dwolla-v2";

const getEnvironment = (): "production" | "sandbox" => {
  const environment = process.env.DWOLLA_ENV as string;

  switch (environment) {
    case "sandbox":
      return "sandbox";
    case "production":
      return "production";
    default:
      throw new Error(
        "Dwolla environment should either be set to `sandbox` or `production`"
      );
  }
};

const dwollaClient = new Client({
  environment: getEnvironment(),
  key: process.env.DWOLLA_KEY as string,
  secret: process.env.DWOLLA_SECRET as string,
});

// Create a Dwolla Funding Source using a Plaid Processor Token
export const createFundingSource = async (
  options: CreateFundingSourceOptions
) => {
  try {
    return await dwollaClient
      .post(`customers/${options.customerId}/funding-sources`, {
        name: options.fundingSourceName,
        plaidToken: options.plaidToken,
      })
      .then((res) => res.headers.get("location"));
  } catch (err) {
    console.error("Creating a Funding Source Failed: ", err);
  }
};

export const createOnDemandAuthorization = async () => {
  try {
    const onDemandAuthorization = await dwollaClient.post(
      "on-demand-authorizations"
    );
    const authLink = onDemandAuthorization.body._links;
    return authLink;
  } catch (err) {
    console.error("Creating an On Demand Authorization Failed: ", err);
  }
};

export const createDwollaCustomer = async (
  newCustomer: NewDwollaCustomerParams
) => {
  try {
    return await dwollaClient
      .post("customers", newCustomer)
      .then((res) => res.headers.get("location"));
  } catch (err) {
    console.error("Creating a Dwolla Customer Failed: ", err);
  }
};

export const createTransfer = async ({
  sourceFundingSourceUrl,
  destinationFundingSourceUrl,
  amount,
}: TransferParams) => {
  try {
    const requestBody = {
      _links: {
        source: {
          href: sourceFundingSourceUrl,
        },
        destination: {
          href: destinationFundingSourceUrl,
        },
      },
      amount: {
        currency: "USD",
        value: amount,
      },
    };
    return await dwollaClient
      .post("transfers", requestBody)
      .then((res) => res.headers.get("location"));
  } catch (err) {
    console.error("Transfer fund failed: ", err);
  }
};

export const addFundingSource = async ({
  dwollaCustomerId,
  processorToken,
  bankName,
}: AddFundingSourceParams) => {
  try {
    // create dwolla auth link
    const dwollaAuthLinks = await createOnDemandAuthorization();

    // add funding source to the dwolla customer & get the funding source url
    const fundingSourceOptions = {
      customerId: dwollaCustomerId,
      fundingSourceName: bankName,
      plaidToken: processorToken,
      _links: dwollaAuthLinks,
    };
    return await createFundingSource(fundingSourceOptions);
  } catch (err) {
    console.error("Transfer fund failed: ", err);
  }
};

// import { Client } from "dwolla-v2";
// import { equalsIgnoreCase } from "../utils";
// import { getEnvironmentVariable } from "./";

// export interface CreateExchangeOptions {
//     customerId: string;
//     exchangePartnerHref: string;
//     token: string;
// }

// export interface CreateFundingSourceOptions {
//     customerId: string;
//     exchangeUrl: string;
//     name: string;
//     type: "checking" | "savings";
// }

// export interface CreateUnverifiedCustomerOptions {
//     firstName: string;
//     lastName: string;
//     email: string;
// }

// const client = new Client({
//     environment: getEnvironmentVariable("DWOLLA_ENV").toLowerCase() as "production" | "sandbox",
//     key: getEnvironmentVariable("DWOLLA_KEY"),
//     secret: getEnvironmentVariable("DWOLLA_SECRET")
// });

// /**
//  * Creates a customer exchange resource using the token that was retrieved from Plaid.
//  */
// export async function createExchange({
//     customerId,
//     exchangePartnerHref,
//     token
// }: CreateExchangeOptions): Promise<string> {
//     const response = await client.post(`/customers/${customerId}/exchanges`, {
//         _links: {
//             "exchange-partner": {
//                 href: exchangePartnerHref
//             }
//         },
//         token
//     });
//     return response.headers.get("Location");
// }

// /**
//  * Creates a funding source for a customer using an exchange URL.
//  */
// export async function createFundingSource({
//     customerId,
//     exchangeUrl,
//     name,
//     type
// }: CreateFundingSourceOptions): Promise<string> {
//     const response = await client.post(`/customers/${customerId}/funding-sources`, {
//         _links: {
//             exchange: {
//                 href: exchangeUrl
//             }
//         },
//         bankAccountType: type,
//         name
//     });
//     return response.headers.get("Location");
// }

// /**
//  * Creates an unverified customer record.
//  */
// export async function createUnverifiedCustomer(options: CreateUnverifiedCustomerOptions): Promise<string> {
//     const response = await client.post("customers", { ...options });
//     return response.headers.get("Location");
// }

// /**
//  * Gets Plaid's exchange partner href (link) within Dwolla's systems.
//  */
// export async function getExchangeHref(): Promise<string> {
//     const response = await client.get("/exchange-partners");
//     const partnersList = response.body._embedded["exchange-partners"];
//     const plaidPartner = partnersList.filter((obj: { name: string }) => equalsIgnoreCase(obj.name, "PLAID"))[0];
//     return plaidPartner._links.self.href;
// }