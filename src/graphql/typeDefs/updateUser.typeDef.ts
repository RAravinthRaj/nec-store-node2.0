/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import gql from 'graphql-tag';

export const updateUserTypeDef = gql`
  input UpdateUserInput {
    id: ID!
    email: String
    name: String
    rollNumber: String
    department: Department
    profilePicture: String
    roles: [Role!]
    status: UserStatus
  }

  type UpdateUserResponse {
    message: String!
    token: String
  }

  type Mutation {
    updateUser(input: UpdateUserInput!): UpdateUserResponse!
  }
`;
