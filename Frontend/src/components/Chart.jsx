/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJs,
    BarElement,
    Title,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
} from "chart.js";
import { useQuery } from "@tanstack/react-query";

ChartJs.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const barChartData = {
    labels: [], // Will be populated dynamically
    datasets: [
        {
            label: "Sales",
            data: [], // Will be populated dynamically
            backgroundColor: "rgba(75, 192, 192, 0.6)", // Adjust opacity for better visuals
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
        },
    ],
};

const options = {
    responsive: true,
    plugins: {
        legend: {
            display: true,
            position: "top",
        },
    },
    scales: {
        x: {
            title: {
                display: true,
                text: "Price Range", // Label for the x-axis
            },
        },
        y: {
            beginAtZero: true,
            ticks: {
                stepSize: 1, // Ensure integer values only
                callback: function (value) {
                    return Number.isInteger(value) ? value : null; // Display only integers
                },
            },
            title: {
                display: true,
                text: "Count", // Label for the y-axis
            },
        },
    },
};


const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];


const Chart = () => {
    const [month, setMonth] = useState("April")
    const { isLoading, data } = useQuery({
        queryKey: ["transactionData", month],
        queryFn: () =>
            fetch(`http://localhost:3000/barchart?month=${month}`).then((res) =>
                res.json()
            ),
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const priceRanges = [];
    const counts = [];
    for (let i = 0; i < data?.data.length; i++) {
        priceRanges.push(data.data[i].priceRange); // Populate x-axis labels
        counts.push(data.data[i].count); // Populate y-axis values
    }

    barChartData.labels = priceRanges;
    barChartData.datasets[0].data = counts;

    return (
        <div className="h-screen w-screen flex justify-center items-center">

            <div className="flex flex-col gap-10">
                <h1 className="text-2xl font-semibold">Pie Chart view with category and count in a month</h1>

                <div className="">
                    <select name="month" id="" className="border-black border-[1px] text-lg bg-yellow-500 rounded-lg px-2 py-1" onChange={(e) => {
                        setMonth(e.target.value)
                    }}>
                        <option value={""}>{month}</option>
                        {months.map((month, i) => (
                            <option key={i} value={month}>
                                {month}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="h-[500px] w-fit overflow-hidden">
                    <Bar
                        style={{ width: "100%", height: "100%" }}
                        options={options}
                        data={barChartData}
                    />
                </div>
            </div>

        </div>
    );
};

export default Chart;
