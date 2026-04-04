/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Department } from '../src/config/enum.config';
import { isValidDepartment } from '../src/utils/utils';

describe('Department validation', () => {
  it('accepts valid departments', () => {
    expect(isValidDepartment(Department.CSE)).toBe(true);
    expect(isValidDepartment(Department.IT)).toBe(true);
  });

  it('rejects invalid departments', () => {
    expect(isValidDepartment('MBA')).toBe(false);
    expect(isValidDepartment('')).toBe(false);
  });
});
