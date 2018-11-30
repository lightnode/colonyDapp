/* @flow */

import type { ObjectSchema } from 'yup';

import OrbitDB from 'orbit-db';
import generate from 'nanoid/generate';
import urlDictionary from 'nanoid/url';

import type {
  AccessController,
  Identity,
  IdentityProvider,
  OrbitDBAddress,
  OrbitDBStore,
} from './types';

import { Store } from './stores';

import IPFSNode from '../ipfs';

const generateId = () => generate(urlDictionary, 21);

// TODO: better typing
type Resolver = Object;

type StoreBlueprint = {
  name: string,
  schema: ObjectSchema,
  getAccessController: (storeProps?: Object) => AccessController<*, *> | void,
  type: typeof Store,
};

type StoreIdentifier = string | OrbitDBAddress;

const { isValidAddress, parseAddress } = OrbitDB;

/**
 * The DDB class is a wrapper around an OrbitDB instance. It will be used to handle
 * schemas, create new Stores and keep track of the created ones. It also includes
 * means to add resolvers for resolving store addresses
 */
class DDB {
  _orbitNode: OrbitDB;

  _stores: Map<string, Store>;

  _resolvers: Map<string, Resolver>;

  static async createDatabase<I: Identity, P: IdentityProvider<I>>(
    ipfsNode: IPFSNode,
    identityProvider: P,
  ): Promise<DDB> {
    const identity = await identityProvider.createIdentity();
    await ipfsNode.ready;
    return new DDB(ipfsNode, identity);
  }

  constructor(ipfsNode: IPFSNode, identity: Identity) {
    this._stores = new Map();
    this._resolvers = new Map();
    this._orbitNode = new OrbitDB(ipfsNode.getIPFS(), identity, {
      // TODO: is there a case where this could not be the default?
      // TODO should this be a constant, or configurable? and `colonyOrbitDB`?
      path: 'colonyOrbitdb',
    });
  }

  _makeStore(
    orbitStore: OrbitDBStore,
    { name, schema, type: StoreClass }: StoreBlueprint,
  ): Store {
    if (!schema) {
      throw new Error(`Schema for store ${name} not found. Did you define it?`);
    }
    const store = new StoreClass(orbitStore, name, schema);
    const { root, path } = store.address;
    this._stores.set(`${root}/${path}`, store);
    return store;
  }

  _getCachedStore(address: OrbitDBAddress) {
    const { root, path } = address;
    return this._stores.has(`${root}/${path}`)
      ? this._stores.get(`${root}/${path}`)
      : null;
  }

  _resolveStoreAddress(identifier: string) {
    const [resolverKey, id] = identifier.split('.');
    if (!resolverKey || !id) {
      throw new Error('Identifier is not in a valid form');
    }

    const resolver = this._resolvers.get(resolverKey);
    if (!resolver) {
      throw new Error(
        `Resolver with key ${resolverKey} not found. Did you register it?`,
      );
    }

    return resolver.resolve(id);
  }

  async _getStoreAddress(
    identifier: StoreIdentifier,
  ): Promise<OrbitDBAddress | null> {
    if (!identifier) {
      throw new Error(
        'Please define an identifier for the store you want to retrieve',
      );
    }
    if (typeof identifier === 'string') {
      // If it's already a valid address we parse it
      if (isValidAddress(identifier)) {
        return parseAddress(identifier);
      }
      // Otherwise it might be a resolver identifier (e.g. 'user.someusername')
      const addressString = await this._resolveStoreAddress(identifier);
      if (!addressString) {
        return null;
      }
      if (!isValidAddress(addressString)) {
        throw new Error(`Address found not valid: ${addressString}`);
      }
      return parseAddress(addressString);
    }
    return identifier;
  }

  addResolver(resolverId: string, resolver: Resolver) {
    this._resolvers.set(resolverId, resolver);
  }

  async createStore(blueprint: StoreBlueprint, storeProps?: Object) {
    const { getAccessController, name, type: StoreClass } = blueprint;
    if (name.includes('.')) {
      throw new Error('A dot (.) in store names is not allowed');
    }
    const id = `${name}.${generateId()}`;

    const accessController = getAccessController(storeProps);
    if (!accessController) {
      console.warn(
        `Store with schema ${name} created without an accessController`,
      );
    }

    const orbitStore: OrbitDBStore = await this._orbitNode.create(
      id,
      StoreClass.orbitType,
      // We might want to use more options in the future. Just add them here
      { accessController },
    );
    return this._makeStore(orbitStore, blueprint);
  }

  async getStore(
    blueprint: StoreBlueprint,
    identifier: StoreIdentifier,
    storeProps?: Object,
  ): Promise<Store | null> {
    const { name: bluePrintName, getAccessController, type } = blueprint;

    const address = await this._getStoreAddress(identifier);
    if (!address) return null;
    const cachedStore = this._getCachedStore(address);
    if (cachedStore) return cachedStore;

    const name = address.path.split('.')[0];
    if (name !== bluePrintName) {
      throw new Error(`This is not the correct blueprint for store ${name}`);
    }

    const accessController = getAccessController(storeProps);
    if (!accessController) {
      console.warn(
        `Store with schema ${name} created without an accessController`,
      );
    }

    const orbitStore: OrbitDBStore = await this._orbitNode.open(address, {
      accessController,
    });
    if (orbitStore.type !== type.orbitType) {
      throw new Error(
        `${orbitStore.type} is not the correct type for store ${name}`,
      );
    }
    return this._makeStore(orbitStore, blueprint);
  }

  async stop() {
    // Doing some checks for good measure
    /* eslint-disable no-underscore-dangle */
    if (!this._orbitNode._ipfs.isOnline()) {
      // If we stop the orbitNode and ipfs is not connected, it will throw
      // (the infamous libp2p hasn't started yet error), so we start it again
      await this._orbitNode._ipfs.start();
    }
    await this._orbitNode.stop();
    return this._orbitNode._ipfs.stop();
    /* eslint-enable no-underscore-dangle */
  }
}

export default DDB;
