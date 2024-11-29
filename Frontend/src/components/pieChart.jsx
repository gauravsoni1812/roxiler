import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJs,
    Tooltip,
    Legend,
    ArcElement
} from "chart.js";
import { useQuery } from '@tanstack/react-query';
import { useState } from "react";

ChartJs.register(ArcElement, Tooltip, Legend);

const pieChartData = {
    labels: [],
    datasets: [
        {
            label: "Count",
            data: [],
            backgroundColor: [],
            hoverOffset: 2
        }
    ]

}

const PieChart = () => {
    const [month, setMonth] = useState("April");
    const { isLoading, data } = useQuery({
        queryKey: ["transactionData", month],
        queryFn: () =>
            fetch(`http://localhost:3000/categorycount?month=${month}`).then((res) =>
                res.json()
            ),
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }
    const category = [];
    const counts = [];
    const background = []
    for (let i = 0; i < data?.data.length; i++) {
        category.push(data.data[i].category); // Populate x-axis labels
        background.push(`rgba(${Math.ceil(Math.random() * 255)},${Math.ceil(Math.random() * 255)},${Math.ceil(Math.random() * 255)} )`)
        counts.push(data.data[i].count); // Populate y-axis values
    }
    console.log(background)
    pieChartData.labels = category;
    pieChartData.datasets[0].data = counts;
    pieChartData.datasets[0].backgroundColor = background;

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

    const options = {}
    return (
        <div className='h-full w-full flex justify-center items-center'>

            <div className="flex flex-col my-10 gap-9">
            <h1 className="text-2xl font-semibold">Pie Chart view with category and count in a month</h1>

                <div className="">
                    <select name="month" id="" className="border-black border-[1px] text-lg bg-yellow-500 rounded-xl px-2 py-1" onChange={(e) => {
                        setMonth(e.target.value)
                    }}>
                        <option value={"April"}>{month}</option>
                        {months.map((month, i) => (
                            <option key={i} value={month}>
                                {month}
                            </option>
                        ))}
                    </select>

                </div>
                <div className='h-[600px] w-[600px]'>
                    <Pie options={options} data={pieChartData} />
                </div>
            </div>

        </div>

    )
}

export default PieChart