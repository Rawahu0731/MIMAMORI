declare module '@mediapipe/tasks-vision' {
  export interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
    presence?: number;
  }

  export interface PoseLandmarkerResult {
    landmarks: Landmark[][];
    worldLandmarks: Landmark[][];
    segmentationMasks?: ImageData[];
  }

  export class PoseLandmarker {
    static POSE_CONNECTIONS: Array<[number, number]>;
    
    static createFromOptions(
      wasmFileset: any,
      options: {
        baseOptions: {
          modelAssetPath: string;
          delegate?: string;
        };
        runningMode: string;
        numPoses?: number;
        minPoseDetectionConfidence?: number;
        minPosePresenceConfidence?: number;
        minTrackingConfidence?: number;
      }
    ): Promise<PoseLandmarker>;

    detectForVideo(
      videoFrame: HTMLVideoElement,
      timestamp: number
    ): PoseLandmarkerResult;
  }

  export class FilesetResolver {
    static forVisionTasks(wasmLoaderPath: string): Promise<any>;
  }
}

