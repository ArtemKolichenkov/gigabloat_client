var grpc = require('grpc');
import { summary, rootData } from './grpc_store';

var gigabloat_proto = require('gigabloat_proto')

var gigabloatService = grpc.loadPackageDefinition(gigabloat_proto.gigabloatDefinition).gigabloat;
console.log(gigabloatService)
var client = new gigabloatService.Gigabloat('localhost:50051',
    grpc.credentials.createInsecure());

// SETUP OVER


// REQUEST

export const scanDirectory = async (dirpath) => {
    function scanResultCallback(error, scanResult) {
        if (error) {
            summary.set(error);
            return;
        }
        summary.set(scanResult.summary);
    }

    const payload = {
        path: dirpath,
    }
    console.log('scan')
    client.scanTarget(payload, scanResultCallback);
}

export const getRoot = async (dirpath) => {
    function rootResultCallback(error, rootResult) {
        if (error) {
            rootData.set(error);
            return;
        }
        rootData.set(rootResult);
    }

    const payload = {
        path: dirpath,
    }
    client.getRoot(payload, rootResultCallback);
}
