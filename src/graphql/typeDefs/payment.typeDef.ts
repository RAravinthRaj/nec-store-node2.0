/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import gql from 'graphql-tag';

export const paymentTypeDef = gql`
  input RecordPaymentTransactionInput {
    amount: Float!
    currency: String
    status: String!
    failureReason: String
    razorpayOrderId: String
    razorpayPaymentId: String
    razorpaySignature: String
    metadata: String
  }

  input RazorpayVerifyPaymentInput {
    products: [OrderProductInput!]!
    razorpayOrderId: String!
    razorpayPaymentId: String!
    razorpaySignature: String!
  }

  type RazorpayOrderResponse {
    id: String!
    amount: Int!
    currency: String!
    key: String!
  }

  type RazorpayOrderCreateResponse {
    message: String!
    paymentOrder: RazorpayOrderResponse!
  }

  type VerifyPaymentResponse {
    message: String!
    order: Order!
  }

  type RecordPaymentTransactionResponse {
    message: String!
  }

  type Mutation {
    createRazorpayOrder(products: [OrderProductInput!]!): RazorpayOrderCreateResponse!
    verifyRazorpayPayment(input: RazorpayVerifyPaymentInput!): VerifyPaymentResponse!
    recordPaymentTransaction(input: RecordPaymentTransactionInput!): RecordPaymentTransactionResponse!
  }
`;
