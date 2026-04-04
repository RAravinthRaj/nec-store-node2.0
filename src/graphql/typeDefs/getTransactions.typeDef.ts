/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import gql from 'graphql-tag';

export const getTransactionsTypeDef = gql`
  type TransactionsResponse {
    items: [RetailerTransactionItem!]!
    totalAmount: Float!
    totalCount: Int!
  }

  input GetTransactionsInput {
    from: String
    to: String
    status: String
    search: String
    skip: Int
    limit: Int
    orderBy: String
  }

  type Query {
    getTransactions(input: GetTransactionsInput): TransactionsResponse!
  }
`;
