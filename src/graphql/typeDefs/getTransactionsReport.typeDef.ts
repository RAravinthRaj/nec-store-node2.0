/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import gql from 'graphql-tag';

export const getTransactionsReportTypeDef = gql`
  input GetTransactionsReportInput {
    from: String!
    to: String!
    status: String
    search: String
  }

  type GetTransactionsReportResponse {
    message: String!
  }

  type Mutation {
    getTransactionsReport(input: GetTransactionsReportInput): GetTransactionsReportResponse!
  }
`;
