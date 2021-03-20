import {
  addHexPrefix,
  publicToAddress,
  toChecksumAddress,
} from 'ethereumjs-util';
import HDKey from 'hdkey';
import { LedgerWalletProvider } from '../../providers/ledger';

export class DeterministicWallet {
  protected address: string;
  protected dPath: string;
  protected index: number;

  constructor(address: string, dPath: string, index: number) {
    this.address = address;
    this.dPath = dPath;
    this.index = index;
  }

  public getAddressString(): string {
    return this.address;
  }

  public getPath(): string {
    return `${this.dPath}/${this.index}`;
  }
}

export interface GetDeterministicWalletsArgs {
  seed?: string;
  dPath: string;
  publicKey?: string;
  chainCode?: string;
  limit: number;
  offset: number;
}

export interface DeterministicWalletData {
  index: number;
  address: string;
}

export const getDeterministicWallets = (
  args: GetDeterministicWalletsArgs,
): DeterministicWalletData[] => {
  const { seed, dPath, publicKey, chainCode, limit, offset } = args;
  let pathBase;
  let hdk;

  console.log(
    'is hardened',
    dPath.split('/').length - 1,
    dPath.split('/').length - 1 === 2,
  );

  // if seed present, treat as mnemonic
  // if pubKey & chainCode present, treat as HW wallet
  if (seed) {
    hdk = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'));
    pathBase = dPath;
  } else if (publicKey && chainCode) {
    hdk = new HDKey();
    hdk.publicKey = Buffer.from(publicKey, 'hex');
    hdk.chainCode = Buffer.from(chainCode, 'hex');
    pathBase = 'm';
  } else {
    return [];
  }
  const wallets: DeterministicWalletData[] = [];
  for (let i = 0; i < limit; i++) {
    const index = i + offset;
    const dkey = hdk.derive(`${pathBase}/${index}`);
    const address = publicToAddress(dkey.publicKey, true).toString('hex');
    wallets.push({
      index,
      address: toChecksumAddress(addHexPrefix(address)),
    });
  }
  return wallets;
};

export async function determineWallet(dPath: string, index: number) {
  const { publicKey, chainCode } = await LedgerWalletProvider.getChainCode(
    dPath,
  );
  console.log({ publicKey, chainCode });
  const hdk = new HDKey();
  hdk.publicKey = Buffer.from(publicKey, 'hex');
  hdk.chainCode = Buffer.from(chainCode, 'hex');
  const pathBase = 'm';
  const dkey = hdk.derive(`${pathBase}/${index}`);
  console.log(dkey);
  return toChecksumAddress(
    addHexPrefix(publicToAddress(dkey.publicKey, true).toString('hex')),
  );
}
