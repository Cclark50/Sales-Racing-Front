import {useEffect, useRef, type FC} from "react";
import * as THREE from 'three'

interface Person {
    id:number;
    name:string;
    team: string;
    currSales:number;
}

interface RaceTrackProps{
    people: Person[];
    quota: number;
}

const RaceTrack:  FC<RaceTrackProps> = ({people, quota}) =>{
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
    const carsRef = useRef<THREE.Group[]>([]);
    const animationFrameRef = useRef<number | null>(null);

    function setIsometric (camera : THREE.OrthographicCamera, lookx : number, looky : number, lookz:number, distance : number ): void{
        const x = distance * 0.707;
        const z = distance * 0.707;
        const y = distance * 0.577;

        camera.position.x = x;
        camera.position.y = y;
        camera.position.z = z;
        camera.lookAt(lookx, looky, lookz);
    }

    useEffect(() => {
        if(!canvasRef.current){
            console.log('Canvas ref not found');
            return;
        }

        const canvas = canvasRef.current;
        const container = canvas.parentElement;
        if(!container){
            console.log('Container not found');
            return;
        }

        const width = container.clientWidth;
        const height = container.clientHeight;

        console.log('Canvas Dimentions: ', width, height);
        console.log('Container: ', container);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);

        // const camera = new THREE.OrthographicCamera(
        //   -width / 2, width / 2,
        //   height /2, -height / 2,
        //     0.1, 1000
        // );

        const camera = new THREE.OrthographicCamera(
            -200, 200, 150, -150, 0.1, 1000
        );
        setIsometric(camera, 0, 0, 0, 10);
        scene.add(new THREE.AxesHelper(100));
        // camera.position.z = 10;



        const renderer = new THREE.WebGLRenderer({
            canvas:canvas,
            antialias:true
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const trackGeometry = new THREE.RingGeometry(80, 120, 32);
        const trackMaterial = new THREE.MeshBasicMaterial({
            color:0x444444,
            side:THREE.DoubleSide
        })
        const track = new THREE.Mesh(trackGeometry, trackMaterial);
        scene.add(track)

        const innerLineGeometry = new THREE.RingGeometry(79,81,32);
        const outerLineGeometry = new THREE.RingGeometry(119, 121,32);
        const lineMaterial = new THREE.MeshBasicMaterial({color:0xffffff});

        const innerLine = new THREE.Mesh(innerLineGeometry, lineMaterial);
        const outerLine = new THREE.Mesh(outerLineGeometry, lineMaterial);
        scene.add(innerLine);
        scene.add(outerLine);

        sceneRef.current = scene;
        rendererRef.current = renderer;
        cameraRef.current = camera;

        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }
        animate();

        const handleResize = () => {
            if(!container) return;

            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;

            camera.left = -newWidth / 2;
            camera.right = newWidth / 2;
            camera.top = newHeight / 2;
            camera.bottom = -newHeight / 2;

            renderer.setSize(newWidth, newHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            if(animationFrameRef.current){
                cancelAnimationFrame(animationFrameRef.current);
            }
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
        }
    }, []);

    useEffect(() => {
        if(!sceneRef.current || !people.length) return;

        const scene = sceneRef.current;

        carsRef.current.forEach(car => scene.remove(car));
        carsRef.current = [];

        people.forEach((person, index) => {
            const carGroup = new THREE.Group();

            const carGeometry = new THREE.PlaneGeometry(8,4);
            const carMaterial = new THREE.MeshBasicMaterial(
                {color:getCarColor(index)}
            );
            const carMesh = new THREE.Mesh(carGeometry, carMaterial);
            carGroup.add(carMesh);

            const progress = Math.min (person.currSales/quota, 1);
            const position = getTrackPosition(progress);
            carGroup.position.set(position.x, position.y, 1);

            scene.add(carGroup);
            carsRef.current.push(carGroup);
        });
    }, [people, quota]);

    const getCarColor = (index:number) :number => {
        const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
        return colors[index % colors.length];
    }

    const getTrackPosition = (progress:number): {x:number, y:number} => {
        const angle = progress * Math.PI * 2;
        const radius = 100;

        return {
            x: Math.cos(angle)*radius,
            y: Math.sin(angle)*radius
        };
    };

    return(
        <canvas
            ref={canvasRef}
            style={{
                width:'100%',
                height: '100%',
                display: 'block'
            }}
        />
    );
};

export default RaceTrack;