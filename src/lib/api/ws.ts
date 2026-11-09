export const WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ?? "ws://localhost:8000/ws/trading";

export type WsState = "connecting" | "open" | "closed";
export type WsMessage = { type: string; payload: unknown };

/** Reconnecting WebSocket client. Browser-only: call connect() from an effect. */
export class TradingSocket {
  private ws: WebSocket | null = null;
  private retry = 0;
  private stopped = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private onMessage: (m: WsMessage) => void,
    private onState: (s: WsState) => void,
  ) {}

  connect() {
    this.stopped = false;
    this.onState("connecting");
    try {
      this.ws = new WebSocket(WS_URL);
    } catch {
      this.schedule();
      return;
    }
    this.ws.onopen = () => {
      this.retry = 0;
      this.onState("open");
    };
    this.ws.onmessage = (e) => {
      try {
        this.onMessage(JSON.parse(e.data));
      } catch {
        /* ignore malformed frames */
      }
    };
    this.ws.onclose = () => {
      this.onState("closed");
      this.schedule();
    };
  }

  private schedule() {
    if (this.stopped) return;
    const delay = Math.min(30000, 1000 * 2 ** this.retry++);
    this.timer = setTimeout(() => this.connect(), delay);
  }

  close() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.ws?.close();
  }
}
