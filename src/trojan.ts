import { connect } from 'cloudflare:sockets';
import { sha224 } from './helpers';

const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;

export async function handleTrojanWebSocket(request: Request, password: string): Promise<Response> {
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  const webSocketPair = new WebSocketPair();
  const [client, webSocket] = Object.values(webSocketPair);

  webSocket.accept();

  let remoteSocket: any = null;

  webSocket.addEventListener('message', async (event) => {
    try {
      const trojanBuffer = new Uint8Array(event.data as ArrayBuffer);

      if (!remoteSocket) {
        // Parse Trojan header
        const { addressRemote, portRemote, rawDataIndex } =
          await parseTrojanHeader(trojanBuffer, password);

        if (!addressRemote || !portRemote) {
          throw new Error('Invalid address or port');
        }

        // Connect to remote server
        remoteSocket = await handleTCPOutBound(
          webSocket,
          addressRemote,
          portRemote,
          trojanBuffer.slice(rawDataIndex)
        );
      } else {
        // Forward subsequent data to remote
        if (remoteSocket?.writable) {
          const writer = remoteSocket.writable.getWriter();
          await writer.write(trojanBuffer);
          writer.releaseLock();
        }
      }
    } catch (error) {
      console.error('Trojan error:', error);
      closeWebSocket(webSocket);
    }
  });

  webSocket.addEventListener('close', () => {
    if (remoteSocket) {
      try {
        remoteSocket.close();
      } catch (e) {}
    }
  });

  webSocket.addEventListener('error', () => {
    if (remoteSocket) {
      try {
        remoteSocket.close();
      } catch (e) {}
    }
  });

  return new Response(null, {
    status: 101,
    webSocket: client
  });
}

async function parseTrojanHeader(trojanBuffer: Uint8Array, expectedPassword: string) {
  // Trojan header format:
  // Password (SHA224 hex, 56 bytes) + CRLF + Command (1 byte) + Address Type (1 byte) + Address + Port (2 bytes) + CRLF

  const passwordHash = await sha224(expectedPassword);
  const receivedPassword = new TextDecoder().decode(trojanBuffer.slice(0, 56));

  if (receivedPassword !== passwordHash) {
    throw new Error('Invalid Trojan password');
  }

  // Check for CRLF after password
  if (trojanBuffer[56] !== 0x0d || trojanBuffer[57] !== 0x0a) {
    throw new Error('Invalid Trojan header format');
  }

  const command = trojanBuffer[58];
  if (command !== 0x01) { // Only support CONNECT (0x01)
    throw new Error('Unsupported Trojan command: ' + command);
  }

  const addressType = trojanBuffer[59];
  let addressLength = 0;
  let addressValue = '';
  let addressRemote = '';
  let addressIndex = 60;

  switch (addressType) {
    case 0x01: // IPv4
      addressLength = 4;
      addressValue = trojanBuffer.slice(addressIndex, addressIndex + addressLength).join('.');
      addressRemote = addressValue;
      break;
    case 0x03: // Domain
      addressLength = trojanBuffer[addressIndex];
      addressIndex++;
      addressValue = new TextDecoder().decode(
        trojanBuffer.slice(addressIndex, addressIndex + addressLength)
      );
      addressRemote = addressValue;
      break;
    case 0x04: // IPv6
      addressLength = 16;
      const ipv6Bytes = trojanBuffer.slice(addressIndex, addressIndex + addressLength);
      addressValue = Array.from({ length: 8 }, (_, i) =>
        ((ipv6Bytes[i * 2] << 8) + ipv6Bytes[i * 2 + 1]).toString(16)
      ).join(':');
      addressRemote = `[${addressValue}]`;
      break;
    default:
      throw new Error('Invalid address type: ' + addressType);
  }

  const portIndex = addressIndex + addressLength;
  const portRemote = (trojanBuffer[portIndex] << 8) + trojanBuffer[portIndex + 1];

  // Check for CRLF after port
  const crlfIndex = portIndex + 2;
  if (trojanBuffer[crlfIndex] !== 0x0d || trojanBuffer[crlfIndex + 1] !== 0x0a) {
    throw new Error('Invalid Trojan header format');
  }

  const rawDataIndex = crlfIndex + 2;

  return {
    addressRemote,
    portRemote,
    rawDataIndex
  };
}

async function handleTCPOutBound(
  webSocket: WebSocket,
  addressRemote: string,
  portRemote: number,
  rawClientData: Uint8Array
) {
  // Connect to remote server
  const tcpSocket = connect({
    hostname: addressRemote,
    port: portRemote
  });

  // Write initial data
  const writer = tcpSocket.writable.getWriter();
  if (rawClientData.length > 0) {
    await writer.write(rawClientData);
  }
  writer.releaseLock();

  // Pipe remote data to WebSocket
  await tcpSocket.readable.pipeTo(
    new WritableStream({
      async write(chunk) {
        if (webSocket.readyState === WS_READY_STATE_OPEN) {
          webSocket.send(chunk);
        }
      },
      close() {
        closeWebSocket(webSocket);
      },
      abort(reason) {
        console.error('TCP stream aborted:', reason);
        closeWebSocket(webSocket);
      }
    })
  );

  return tcpSocket;
}

function closeWebSocket(webSocket: WebSocket) {
  try {
    if (webSocket.readyState === WS_READY_STATE_OPEN || webSocket.readyState === WS_READY_STATE_CLOSING) {
      webSocket.close();
    }
  } catch (error) {
    console.error('Error closing WebSocket:', error);
  }
}
