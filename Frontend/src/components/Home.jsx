import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    ArrowUpDown,
    DicesIcon,
    Phone,
    Search,
    User,
} from "lucide-react";
// import axios from "axios"
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import 'react-tooltip/dist/react-tooltip.css'
import { Tooltip } from 'react-tooltip'
import { useSearchParams } from "react-router-dom";
import { debounce } from "chart.js/helpers";

const columnHelper = createColumnHelper();

const truncateWithTooltip = (text, wordLimit = 5) => {
    const words = text.split(" ");
    return words.length > wordLimit
        ? words.slice(0, wordLimit).join(" ") + "..."
        : text;
};

const columns = [
    columnHelper.accessor("id", {
        cell: (info) => info.getValue(),
        header: () => (
            <span className="flex items-center">
                <User className="mr-2" size={16} /> ID
            </span>
        ),
    }),

    columnHelper.accessor("title", {
        cell: (info) => {
            const title = info.getValue();
            const truncatedDescription = truncateWithTooltip(title);
            return (
                <div className="cursor-pointer">
                    <span
                        id={`row${info.row.id}`}
                        className="overflow-auto"
                    >
                        {truncatedDescription}
                    </span>
                    <Tooltip style={{
                        width: "300px",
                        background: "white",
                        color: "black",
                        padding: "5px",
                        wordWrap: "break-word",
                        whiteSpace: "normal", // Allows text to break to the next line
                        borderRadius: "4px", // Optional styling
                        boxShadow: "0 2px 4px rgba(0,0,0)", // Optional shadow
                    }} anchorSelect={`#row${info.row.id}`} content={title} />
                </div>
            );
        },
        header: () => (
            <span className="flex items-center">
                <User className="mr-2" size={16} /> Title
            </span>
        ),
    }),

    columnHelper.accessor("description", {
        id: "description",
        cell: (info) => {
            const description = info.getValue();
            const truncatedDescription = truncateWithTooltip(description);
            return (
                <div className="cursor-pointer w-[320px]">
                    <span
                        id={`element${info.row.id}`}
                        className="overflow-auto"
                        data-tip={description}
                    >
                        {truncatedDescription}
                    </span>
                    <Tooltip style={{
                        width: "300px",
                        background: "white",
                        color: "black",
                        padding: "5px",
                        wordWrap: "break-word",
                        whiteSpace: "normal", // Allows text to break to the next line
                        borderRadius: "4px", // Optional styling
                        boxShadow: "0 2px 4px rgba(0,0,0)", // Optional shadow
                    }} anchorSelect={`#element${info.row.id}`} content={description} />
                </div>
            );
        },
        header: () => (
            <span className="flex items-center">
                <DicesIcon className="mr-2" size={16} /> Description
            </span>
        ),
    }),


    columnHelper.accessor("category", {
        header: () => (
            <span className="flex items-center">
                <Phone className="mr-2" size={16} /> Category
            </span>
        ),
        cell: (info) => info.getValue(),
    }),

    columnHelper.accessor("image", {
        header: () => (
            <span className="flex items-center">
                <Phone className="mr-2" size={16} /> Image
            </span>
        ),
        cell: (info) => <span>
            <img className="h-14 w-14" src={info.getValue()} alt={info.getValue()} />
        </span>
    }),

    columnHelper.accessor("sold", {
        id: "sold",
        header: () => (
            <span className="flex items-center">
                <Phone className="mr-2" size={16} /> Sold
            </span>
        ),
        cell: (info) => <span>
            {info.getValue() ? "True" : "False"}
        </span>,
    }),

    columnHelper.accessor("dateOfSale", {
        id: "dateOfSold",
        header: () => (
            <span className="flex items-center">
                <Phone className="mr-2" size={16} /> dateOfSale
            </span>
        ),
        cell: (info) => info.getValue(),
    }),
];

export default function Home() {
    const [sorting, setSorting] = React.useState([]);
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const [text, setText] = useState("")
    const page = Number(searchParams.get("page")) || 1; // Get page from search params
    const limit = Number(searchParams.get("limit")) || 5; // Get limit from search params
    const search = searchParams.get("search") || ""

    const { isPending, data } = useQuery({
        queryKey: ['transactionData', page, limit, search],
        queryFn: () =>
            fetch(`http://localhost:3000/getAll?page=${page}&limit=${limit}&search=${search}`).then((res) =>
                res.json(),
            ),
        staleTime: 5 * 1000,

    });
    console.log(search)


    const table = useReactTable({
        data: data?.transactions || [],
        columns,
        state: {
            sorting,
            globalFilter,
        },
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
    });

    // const handleSearch = ()=>{
    //     setSearchParams({ search: search }); // Update search params in URL
    // }

    if (isPending) {
        return <span>Loading...</span>;
    }

    // Debounced search handler
    const handleSearch = debounce((value) => {
        setSearchParams({ search: value, page: 1 }); // Reset to page 1 on new search
    }, 300);

    const handlePageChange = (newPage) => {
        setSearchParams({ page: newPage, limit }); // Update search params in URL
    };

    return (
        <div className="flex flex-col justify-center items-center min-h-screen mx-auto py-2 px-4 sm:px-6 lg:px-8 bg-blue-200 gap-4">
            <h1 className="text-xl font-semibold bg-gray-100 rounded-[100%] p-10"> Transaction Dashboard</h1>
            <div>
                <div className="mb-4 relative flex gap-10">
                    <input
                        onChange={(e) => {
                            let value = e.target.value
                            setText(value)
                        }}
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={20}
                    />
                    <button onClick={() => {
                        handleSearch(text)
                    }} className="p-2 rounded-lg bg-green-600 text-white">Search</button>
                </div>
                <div className="bg-white shadow-md rounded-lg">
                    <table className="divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            <div
                                                {...{
                                                    className: header.column.getCanSort()
                                                        ? "cursor-pointer select-none flex items-center"
                                                        : "",
                                                    onClick: header.column.getToggleSortingHandler(),
                                                }}
                                            >
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                <ArrowUpDown className="ml-2" size={14} />
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 w-full">
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 bg-yellow-300 border-[2px] border-black border-collapse"
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-between w-full mt-4">
                    <button
                        className="p-2 bg-yellow-600 font-semibold disabled:bg-gray-300"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    <button
                        className="p-2 bg-yellow-600 font-semibold disabled:bg-gray-300"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!data?.transactions?.length}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

