export const checkInAbi = [
  {
    type: 'function',
    name: 'currentStreak',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'checkIn',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'event',
    name: 'CheckedIn',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'dayIndex', type: 'uint256', indexed: false },
      { name: 'streak', type: 'uint256', indexed: false },
    ],
  },
] as const;
