/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import gql from 'graphql-tag';

export const getIncomingStockTypeDef = gql`
  type IncomingStockResponse {
    items: [AddStockEntry!]!
    totalQuantityAdded: Int!
    totalAmount: Float!
    totalCount: Int!
  }

  input GetIncomingStockInput {
    from: String
    to: String
    categoryId: ID
    title: String
    skip: Int
    limit: Int
    orderBy: String
  }

  type Query {
    getIncomingStock(input: GetIncomingStockInput): IncomingStockResponse!
  }
`;
