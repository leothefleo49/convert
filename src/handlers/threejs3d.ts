import CommonFormats from "src/CommonFormats.ts";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { OBJExporter } from "three/addons/exporters/OBJExporter.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
import { PLYExporter } from "three/addons/exporters/PLYExporter.js";
import { ColladaLoader } from "three/addons/loaders/ColladaLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { ThreeMFLoader } from "three/addons/loaders/3MFLoader.js";

import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

/**
 * Extended Three.js handler supporting many 3D model formats:
 * OBJ, FBX, STL, PLY, COLLADA (.dae), 3MF, glTF/GLB
 * Can convert between formats and render to image.
 */
class threejs3DHandler implements FormatHandler {
  public name = "threejs3d";
  public contributor = "leothefleo49";
  public ready = false;

  public supportedFormats: FileFormat[] = [
    // Input formats
    {
      name: "Wavefront OBJ",
      format: "obj",
      extension: "obj",
      mime: "model/obj",
      from: true, to: true,
      internal: "obj",
      category: "model"
    },
    {
      name: "Autodesk FBX",
      format: "fbx",
      extension: "fbx",
      mime: "application/octet-stream",
      from: true, to: false,
      internal: "fbx",
      category: "model"
    },
    {
      name: "Stereolithography (STL)",
      format: "stl",
      extension: "stl",
      mime: "model/stl",
      from: true, to: true,
      internal: "stl",
      category: "model"
    },
    {
      name: "Polygon File Format (PLY)",
      format: "ply",
      extension: "ply",
      mime: "model/ply",
      from: true, to: true,
      internal: "ply",
      category: "model"
    },
    {
      name: "COLLADA",
      format: "dae",
      extension: "dae",
      mime: "model/vnd.collada+xml",
      from: true, to: false,
      internal: "dae",
      category: "model"
    },
    {
      name: "3D Manufacturing Format (3MF)",
      format: "3mf",
      extension: "3mf",
      mime: "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
      from: true, to: false,
      internal: "3mf",
      category: "model"
    },
    {
      name: "GL Transmission Format Binary",
      format: "glb",
      extension: "glb",
      mime: "model/gltf-binary",
      from: true, to: true,
      internal: "glb",
      category: "model"
    },
    {
      name: "GL Transmission Format",
      format: "gltf",
      extension: "gltf",
      mime: "model/gltf+json",
      from: false, to: true,
      internal: "gltf",
      category: "model"
    },
    // Image output for 3D rendering
    CommonFormats.PNG.supported("png", false, true),
    CommonFormats.JPEG.supported("jpeg", false, true),
    CommonFormats.WEBP.supported("webp", false, true),
  ];

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(90, 16 / 9, 0.1, 4096);
  private renderer!: THREE.WebGLRenderer;

  async init() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(1920, 1080);
    this.ready = true;
  }

  private async loadModel(bytes: Uint8Array, format: string): Promise<THREE.Object3D> {
    const blob = new Blob([bytes as BlobPart]);
    const url = URL.createObjectURL(blob);

    try {
      switch (format) {
        case "obj": {
          const loader = new OBJLoader();
          const text = new TextDecoder().decode(bytes);
          return loader.parse(text);
        }
        case "fbx": {
          const loader = new FBXLoader();
          const group = await new Promise<THREE.Group>((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
          });
          return group;
        }
        case "stl": {
          const loader = new STLLoader();
          const geometry = loader.parse(bytes.buffer as ArrayBuffer);
          const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
          return new THREE.Mesh(geometry, material);
        }
        case "ply": {
          const loader = new PLYLoader();
          const geometry = loader.parse(bytes.buffer as ArrayBuffer);
          geometry.computeVertexNormals();
          const material = new THREE.MeshStandardMaterial({ color: 0xcccccc, vertexColors: geometry.hasAttribute("color") });
          return new THREE.Mesh(geometry, material);
        }
        case "dae": {
          const loader = new ColladaLoader();
          const text = new TextDecoder().decode(bytes);
          const result = loader.parse(text, "");
          return result.scene;
        }
        case "3mf": {
          const loader = new ThreeMFLoader();
          const group = loader.parse(bytes.buffer as ArrayBuffer);
          return group;
        }
        case "glb": {
          const gltf: GLTF = await new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(url, resolve, undefined, reject);
          });
          return gltf.scene;
        }
        default:
          throw new Error("Unsupported 3D input format: " + format);
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private async exportModel(object: THREE.Object3D, format: string): Promise<Uint8Array> {
    switch (format) {
      case "obj": {
        const exporter = new OBJExporter();
        const result = exporter.parse(object);
        return new TextEncoder().encode(result);
      }
      case "stl": {
        const exporter = new STLExporter();
        const result = exporter.parse(object, { binary: true });
        if (result instanceof DataView) {
          return new Uint8Array(result.buffer);
        }
        return new TextEncoder().encode(result as string);
      }
      case "ply": {
        const exporter = new PLYExporter();
        const result = await new Promise<string>((resolve) => {
          exporter.parse(object, (res) => resolve(res as string), {});
        });
        return new TextEncoder().encode(result);
      }
      case "glb": {
        const exporter = new GLTFExporter();
        const result = await new Promise<ArrayBuffer>((resolve, reject) => {
          exporter.parse(object, (gltf) => resolve(gltf as ArrayBuffer), reject, { binary: true });
        });
        return new Uint8Array(result);
      }
      case "gltf": {
        const exporter = new GLTFExporter();
        const result = await new Promise<object>((resolve, reject) => {
          exporter.parse(object, (gltf) => resolve(gltf as object), reject, { binary: false });
        });
        return new TextEncoder().encode(JSON.stringify(result, null, 2));
      }
      default:
        throw new Error("Unsupported 3D output format: " + format);
    }
  }

  private async renderToImage(object: THREE.Object3D, mimeType: string): Promise<Uint8Array> {
    // Setup scene
    this.scene.background = new THREE.Color(0x424242);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(ambientLight);
    this.scene.add(directionalLight);
    this.scene.add(object);

    // Fit camera to object
    const bbox = new THREE.Box3().setFromObject(object);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    this.camera.position.set(center.x + maxDim, center.y + maxDim * 0.5, center.z + maxDim * 1.5);
    this.camera.lookAt(center);

    this.renderer.render(this.scene, this.camera);

    // Cleanup
    this.scene.remove(object);
    this.scene.remove(ambientLight);
    this.scene.remove(directionalLight);

    const bytes: Uint8Array = await new Promise((resolve, reject) => {
      this.renderer.domElement.toBlob((blob) => {
        if (!blob) return reject("Canvas output failed");
        blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf)));
      }, mimeType);
    });
    return bytes;
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const outputFiles: FileData[] = [];

    for (const inputFile of inputFiles) {
      const model = await this.loadModel(inputFile.bytes, inputFormat.internal);
      const baseName = inputFile.name.split(".")[0];

      const isImageOutput = ["png", "jpeg", "webp"].includes(outputFormat.internal);

      if (isImageOutput) {
        const bytes = await this.renderToImage(model, outputFormat.mime);
        outputFiles.push({ name: baseName + "." + outputFormat.extension, bytes });
      } else {
        const bytes = await this.exportModel(model, outputFormat.internal);
        outputFiles.push({ name: baseName + "." + outputFormat.extension, bytes });
      }
    }

    return outputFiles;
  }
}

export default threejs3DHandler;
