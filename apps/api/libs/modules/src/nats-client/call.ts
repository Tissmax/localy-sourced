import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom, timeout } from "rxjs";

export const call = <T>(client: ClientProxy, cmd: string, data: unknown): Promise<T> => {
    return firstValueFrom(client.send<T>({ cmd }, data).pipe(timeout(5000)));
  }