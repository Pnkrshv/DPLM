import axios from 'axios'
import './Statistic.css'
import { useState } from 'react';

export default function Statistic() {
    const [cities, setCities] = useState([]);


    // const fetchCities = async () => {
    //     try {
    //         const repsonse = await axios.get('http://localhost:8080/cities');
    //         setCities(repsonse.data)
    //     } catch (error) {
            
    //     }
    // }

    return (
        <>
            <div className="left-navigation">

            </div>
            <div className="select-form"></div>
            <div className="control-date"></div>
        </>
    )
}