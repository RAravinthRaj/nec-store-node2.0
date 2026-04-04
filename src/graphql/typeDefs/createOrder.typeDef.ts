/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import gql from 'graphql-tag';

export const createOrderTypeDefs = gql`
  input OrderProductInput {
    productId: ID!
    quantity: Int!
  }

  type CreateOrderResponse {
    message: String!
    order: Order!
  }

  type Mutation {
    createOrder(products: [OrderProductInput!]!): CreateOrderResponse!
  }
`;
