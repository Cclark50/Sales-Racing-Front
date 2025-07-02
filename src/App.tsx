import {useEffect, useRef, useState} from 'react'
import './App.css'
import * as signalR from '@microsoft/signalr';

const LOCALHOST = 'http://localhost:5177/api/'

interface Transaction{
    salesPersonId: number;
    amount: number;
}

interface Person{
    id: number;
    name: string;
    team: string;
    currSales: number;
}

interface SaleData{
    personId: number;
    amount: number;
}

const QUOTA = 30000;

function App() {
    const [people, setPeople] = useState<Person[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<boolean>(false);
    const connectionRef = useRef<signalR.HubConnection | null>(null);

    async function loadPeople () {
        try {
            const response = await fetch(LOCALHOST + "people");
            const data = await response.json();
            setPeople(data);
            console.log('people in load: ', people);
            console.log('data: ', data);
        }catch(err) {
            console.log(err);
        }
    }


    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder().withUrl(LOCALHOST + 'salesHub').withAutomaticReconnect().build();
        connectionRef.current = connection;
        connection.onreconnecting((error) => {
            console.log('SignalR: Reconnecting: ', error);
            setConnectionStatus(false);
        });
        connection.onreconnected((ConnectionID) => {
            console.log('SignalR: Reconnected with ID: ', ConnectionID);
            setConnectionStatus(true)
        });
        connection.onclose((error) => {
            console.log('SignalR: Connection closed: ', error);
            setConnectionStatus(false)
        });
        connection.on('SaleCompleted', (saleData: SaleData) => {
            console.log("SaleCompleted: ", saleData);
            console.log("id: ", saleData.personId);
            console.log('people: ',people);


            setPeople(prev => {
                console.log("previous state: ", prev)
                return prev.map(person =>
                    person.id === saleData.personId
                        ? {...person, currSales: saleData.amount}
                        : person
                );
            });

        })

        // connection.start().then(() => {console.log('Connected to SignalR hub')}).catch(console.error);

        const startConnection = async () => {
            try{
                console.log("Starting connection...");
                await connection.start();
                console.log("Connection started...");
                console.log("Connection ID: " , connection.connectionId);
                console.log('connection state: ', connection.state);
                setConnectionStatus(true);
                console.log('Connected to SignalR hub');
            }catch (e) {
                console.error('SignalR connection failed: ', e);
                setConnectionStatus(false);
            }
        };

        startConnection();
        loadPeople();

        return () => {
            if(connectionRef.current){
                console.log("Connection Stopping...");
                connectionRef.current.stop();
            }
        }
    }, []);

    const getProgress = (person:Person) => {
        return Math.min((person.currSales / QUOTA)* 100, 100);
    }

    const testSale = async () => {
        if (people.length === 0) return;

        const randomPerson = people[Math.floor(Math.random() * people.length)];
        console.log(randomPerson);
        const testTransaction : Transaction = {
            salesPersonId: randomPerson.id,
            amount: Math.floor(Math.random() * 10)
        }

        try {
            const response= await fetch(LOCALHOST + 'transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testTransaction)
            });
            console.log(response);

        }catch (e){
            console.error('test sale failed: ', e);
        }
    };

    function peopleTable(){
        console.log("Drawing table: " , people);
        if(!people) return <p>people doesnt exist</p>
        if(people.length === 0) return <p>no people</p>;
        return (
            <div>
                <p>Sales People</p>
                <div>
                    <table>
                        {people.map(person => (
                            <tr key = {person.id}>
                                <td>{person.id}</td>
                                <td>{person.name}</td>
                                <td>{person.team}</td>
                                <td>{person.currSales}</td>
                                <td>{getProgress(person).toFixed(2)}%</td>
                            </tr>
                        ))}
                    </table>
                </div>
            </div>
        )
    }

    return (
        <div className="App">
            <div className="peopleTable">
                {peopleTable()}
            </div>
            <button className={"testButton"} onClick={() => testSale()}>Test Sale</button>
        </div>
    )
}

export default App
