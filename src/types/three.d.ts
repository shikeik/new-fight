import * as THREE from "three"

declare module "three/webgpu" {
  export = THREE
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eruda: any

  interface ImportMeta {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hot?: {
      on: (event: string, cb: (data: any) => void) => void
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      send: (event: string, data: any) => void
    }
  }
}
