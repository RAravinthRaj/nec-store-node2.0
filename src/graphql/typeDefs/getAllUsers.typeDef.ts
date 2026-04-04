/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import gql from 'graphql-tag';

export const getAllUsersTypeDef = gql`
  type GetAllUsersResponse {
    users: [User!]!
    totalCount: Int!
  }

  type Query {
    getAllUsers(
      name: String
      email: String
      skip: Int
      limit: Int
      orderBy: OrderBy
    ): GetAllUsersResponse!
  }
`;
