import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import controlPanel from './controller.html';

class Volume {
    constructor() {
        this.name = "Volume";
        this.description = "Test Volume Rendering with Modifications";

        this.mapper = vtkVolumeMapper.newInstance();

        this.actor = vtkVolume.newInstance();
        this.actor.setMapper(this.mapper);

        this.colorTransferFunction = vtkColorTransferFunction.newInstance();
        // zero is blue
        this.colorTransferFunction.addRGBPoint(0.0, 0.0, 0.0, 1.0);
        // 100 is red.
        this.colorTransferFunction.addRGBPoint(100.0, 1.0, 0.0, 0.0);
        // 1000 is green
        this.colorTransferFunction.addRGBPoint(1000.0, 0, 1.0, 0.0);

        this.opacityTransferFunction = vtkPiecewiseFunction.newInstance();
        this.opacityTransferFunction.addPoint(0.0, 1);
        this.opacityTransferFunction.addPoint(100.0, 1);
        this.opacityTransferFunction.addPoint(1000.0, 1);
        this.actor.getProperty().setRGBTransferFunction(0, this.colorTransferFunction);
        this.actor.getProperty().setScalarOpacity(0, this.opacityTransferFunction);
        // this.actor.getProperty().setScalarOpacityUnitDistance(0, 4.5);
        this.actor.getProperty().setInterpolationTypeToLinear();
        // this.actor.getProperty().setUseGradientOpacity(0, true);
        // this.actor.getProperty().setGradientOpacityMinimumValue(0, 15);
        // this.actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
        // this.actor.getProperty().setGradientOpacityMaximumValue(0, 100);
        // this.actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
        //this.actor.getProperty().setShade(true);
        this.actor.getProperty().setAmbient(0.2);
        this.actor.getProperty().setDiffuse(0.7);
        this.actor.getProperty().setSpecular(0.3);
        this.actor.getProperty().setSpecularPower(8.0);
        this.imageData = vtkImageData.newInstance();
        this.mapper.setSampleDistance(1.0);
    }

    init() {
        let xVoxels = 256;
        let yVoxels = 256;
        let zVoxels = 79;
        this.imageData.setDimensions([xVoxels, yVoxels, zVoxels]);
        let xSpacing = 1.25;
        let ySpacing = 1.25;
        let zSpacing = 3.0;
        this.imageData.setSpacing([xSpacing, ySpacing, zSpacing]);

        let pixelArray = new Int16Array(xVoxels * yVoxels * zVoxels);
        let n = xVoxels * yVoxels * zVoxels;

        for (let i = 0; i < n; i++) {
            pixelArray[i] = 0;
        }
        let scalarArray = vtkDataArray.newInstance({
            name: "Pixels",
            numberOfComponents: 1,
            values: pixelArray,
        });
        this.imageData.getPointData().setScalars(scalarArray);
        this.mapper.setInputData(this.imageData);
    }

    // based on vtkImageData.cxx (vtkDataSet)
    computeIndex(extent, incs, xyz) {
        return ((((xyz[0] - extent[0]) * incs[0]) + ((xyz[1] - extent[2]) * incs[1]) + ((xyz[2] - extent[4]) * incs[2])) | 0);
    }

    // based on vtkImageData.cxx (vtkDataSet)
    computeImageDataIncrements(numberOfComponents) {
        const datasetDefinition = this.imageData.get('extent', 'spacing', 'origin');
        let inc = [0, 0, 0];
        let incr = numberOfComponents;
        for (let idx = 0; idx < 3; ++idx) {
            inc[idx] = incr;
            incr *= (datasetDefinition.extent[idx * 2 + 1] - datasetDefinition.extent[idx * 2] + 1);
        }
        return inc;
    }

    // Set the voxels for a z slice index.
    setSlice(zIndex) {
        console.log("setting slice at" + zIndex);


        const datasetDefinition = this.imageData.get('extent', 'spacing', 'origin');
        let scalars = this.imageData.getPointData().getScalars();
        let increments = this.computeImageDataIncrements(1); // TODO number of components.
        let data = scalars.getData();
        let indexXYZ = [0, 0, zIndex];
        for (let row = 0; row <= datasetDefinition.extent[3]; row++) {
            indexXYZ[1] = row;
            for (let col = 0; col <= datasetDefinition.extent[1]; col++) {
                indexXYZ[0] = col;
                {
                    let destIdx = this.computeIndex(datasetDefinition.extent, increments, indexXYZ);
                    if ((zIndex % 2) === 0) {
                        data[destIdx] = 100;
                    }
                    else {
                        data[destIdx] = 1000;
                    }
                }
            }
        }
    }
};

// ---------------------------------------------------------------------------// Standard rendering code setup // ---------------------------------------------------------------------------
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const vol = new Volume();
vol.init();

renderer.addActor(vol.actor);

renderer.getActiveCamera().yaw(15);

renderer.resetCamera();

renderWindow.render();


function addSlices() {
    for (let z = 0; z < 40; z++) {
        vol.setSlice(z);
        vol.imageData.modified(true);
        vol.actor.modified(true);
        vol.mapper.modified(true);
        renderer.modified(true);
        renderWindow.render();
    }
}

// ----------------------------------------------------------// UI control handling // ----------------------------------------------------------
fullScreenRenderer.addController(controlPanel);
document.getElementById("button").addEventListener("click", (e) => {
    addSlices();
    debugger;
    renderWindow.render();
});

global.volume = vol;

global.renderer = renderer;
global.renderWindow = renderWindow;