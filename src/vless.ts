import { connect } from 'cloudflare:sockets';
import { sha224 } from './helpers';

const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;

export async function handleVlessWebSocket(request: Request, userID: string): Promise<Response> {
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  const webSocketPair = new WebSocketPair();
  const [client, webSocket] = Object.values(webSocketPair);

  webSocket.accept();

  let hasIncomingData = false;
  let remoteSocket: any = null;
  let udpStreamWrite: any = null;

  webSocket.addEventListener('message', async (event) => {
    hasIncomingData = true;

    try {
      const vlessBuffer = new Uint8Array(event.data as ArrayBuffer);

      if (!remoteSocket) {
        // Parse VLESS header
        const { addressRemote, portRemote, rawDataIndex, vlessVersion, isUDP } =
          await parseVlessHeader(vlessBuffer, userID);

        if (!addressRemote || !portRemote) {
          throw new Error('Invalid address or port');
        }

        // Connect to remote server
        if (isUDP) {
          // Handle UDP (DNS queries only for now)
          const { write } = await handleUDPOutBound(webSocket, vlessVersion, addressRemote, portRemote);
          udpStreamWrite = write;
          udpStreamWrite(vlessBuffer.slice(rawDataIndex));
        } else {
          // Handle TCP
          remoteSocket = await handleTCPOutBound(
            webSocket,
            vlessVersion,
            addressRemote,
            portRemote,
            vlessBuffer.slice(rawDataIndex)
          );
        }
      } else {
        // Forward subsequent data to remote
        if (remoteSocket?.writable) {
          const writer = remoteSocket.writable.getWriter();
          await writer.write(vlessBuffer);
          writer.releaseLock();
        }
      }
    } catch (error) {
      console.error('VLESS error:', error);
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

async function parseVlessHeader(vlessBuffer: Uint8Array, userID: string) {
  const version = vlessBuffer[0];
  let isUDP = false;

  // Check UUID
  const uuidBytes = vlessBuffer.slice(1, 17);
  const uuidString = Array.from(uuidBytes)
    .map((b, i) => {
      const hex = b.toString(16).padStart(2, '0');
      return [4, 6, 8, 10].includes(i) ? '-' + hex : hex;
    })
    .join('');

  if (uuidString !== userID) {
    throw new Error('Invalid user ID');
  }

  const optLength = vlessBuffer[17];
  const command = vlessBuffer[17 + optLength + 1];

  if (command === 1) {
    // TCP
  } else if (command === 2) {
    // UDP
    isUDP = true;
  } else {
    throw new Error('Unsupported command: ' + command);
  }

  const portIndex = 17 + optLength + 2;
  const portRemote = (vlessBuffer[portIndex] << 8) + vlessBuffer[portIndex + 1];

  const addressType = vlessBuffer[portIndex + 2];
  let addressLength = 0;
  let addressValue = '';
  let addressRemote = '';

  switch (addressType) {
    case 1: // IPv4
      addressLength = 4;
      addressValue = vlessBuffer.slice(portIndex + 3, portIndex + 3 + addressLength).join('.');
      addressRemote = addressValue;
      break;
    case 2: // Domain
      addressLength = vlessBuffer[portIndex + 3];
      addressValue = new TextDecoder().decode(
        vlessBuffer.slice(portIndex + 4, portIndex + 4 + addressLength)
      );
      addressRemote = addressValue;
      break;
    case 3: // IPv6
      addressLength = 16;
      const ipv6Bytes = vlessBuffer.slice(portIndex + 3, portIndex + 3 + addressLength);
      addressValue = Array.from({ length: 8 }, (_, i) =>
        ((ipv6Bytes[i * 2] << 8) + ipv6Bytes[i * 2 + 1]).toString(16)
      ).join(':');
      addressRemote = `[${addressValue}]`;
      break;
    default:
      throw new Error('Invalid address type: ' + addressType);
  }

  const rawDataIndex = portIndex + 3 + addressLength;

  return {
    addressRemote,
    portRemote,
    rawDataIndex,
    vlessVersion: version,
    isUDP
  };
}

async function handleTCPOutBound(
  webSocket: WebSocket,
  vlessResponseHeader: number,
  addressRemote: string,
  portRemote: number,
  rawClientData: Uint8Array
) {
  // Connect to remote server
  const tcpSocket = connect({
    hostname: addressRemote,
    port: portRemote
  });

  // Send response header
  const writer = tcpSocket.writable.getWriter();
  await writer.write(new Uint8Array([vlessResponseHeader, 0]));

  // Write initial data
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

async function handleUDPOutBound(
  webSocket: WebSocket,
  vlessResponseHeader: number,
  addressRemote: string,
  portRemote: number
) {
  // For simplicity, we'll handle DNS queries only
  const response = await fetch(`https://1.1.1.1/dns-query?name=${addressRemote}&type=A`, {
    headers: { 'Accept': 'application/dns-json' }
  });

  const dnsResult = await response.json() as any;

  if (dnsResult.Answer && dnsResult.Answer.length > 0) {
    const ip = dnsResult.Answer[0].data;
    const dnsResponse = encodeDNSResponse(ip);

    if (webSocket.readyState === WS_READY_STATE_OPEN) {
      webSocket.send(dnsResponse);
    }
  }

  return {
    write: (chunk: Uint8Array) => {
      // Handle future UDP packets
    }
  };
}

function encodeDNSResponse(ip: string): Uint8Array {
  // Simple DNS response encoding (placeholder)
  const parts = ip.split('.').map(Number);
  return new Uint8Array([0, 0, ...parts]);
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
