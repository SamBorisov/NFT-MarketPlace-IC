export const idlFactory = ({ IDL }) => {
  const NFT = IDL.Service({
    'getAsset' : IDL.Func([], [IDL.Vec(IDL.Nat8)], ['query']),
    'getCanistarId' : IDL.Func([], [IDL.Principal], ['query']),
    'getName' : IDL.Func([], [IDL.Text], ['query']),
    'getOwner' : IDL.Func([], [IDL.Principal], ['query']),
    'transferOwnership' : IDL.Func([IDL.Principal], [IDL.Text], []),
  });
  return NFT;
};
export const init = ({ IDL }) => {
  return [IDL.Text, IDL.Principal, IDL.Vec(IDL.Nat8)];
};