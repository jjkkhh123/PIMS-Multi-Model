





import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { MonthYearPicker } from './MonthYearPicker';

// Chart for expenses by category
const CategoryChart: React.FC<{ data: { name: string, value: number, color: string }[] }> = ({ data }) => {
    if (data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">해당 기간의 지출 내역이 없습니다.</div>;
    }
    const maxValue = Math.max(...data.map(d => d.value), 0);

    return (
        <div className="space-y-4 p-4 h-full overflow-y-auto">
            {data.map((d) => {
                const barWidthPercent = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
                return (
                    <div key={d.name} className="flex items-center gap-4 text-sm">
                        <div className="w-24 flex-shrink-0 text-right truncate text-gray-300 font-medium" title={d.name}>
                            {d.name}
                        </div>
                        <div className="flex-grow bg-gray-700/50 rounded h-8">
                            <div
                                style={{ width: `${barWidthPercent}%`, backgroundColor: d.color }}
                                className="h-full rounded transition-all duration-500 ease-out"
                            >
                            </div>
                        </div>
                         <div className="w-28 flex-shrink-0 text-left text-white font-semibold">
                            {d.value.toLocaleString('ko-KR')}원
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


// Chart for income vs expense
const IncomeExpensePieChart: React.FC<{ income: number, expense: number }> = ({ income, expense }) => {
    const total = income + expense;

    if (total === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">해당 월의 수입 또는 지출 내역이 없습니다.</div>;
    }

    const incomePercent = (income / total) * 100;
    const expensePercent = (expense / total) * 100;

    const incomeColor = '#4ade80'; // Green
    const expenseColor = '#38bdf8'; // Blue

    const gradient = `conic-gradient(${incomeColor} 0% ${incomePercent}%, ${expenseColor} ${incomePercent}% 100%)`;

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-4 h-full">
            <div
                className="w-48 h-48 rounded-full"
                style={{ background: gradient }}
                role="img"
                aria-label={`수입 ${incomePercent.toFixed(1)}%, 지출 ${expensePercent.toFixed(1)}%`}
            ></div>
            <div className="space-y-4">
                {/* Legend */}
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: incomeColor }}></span>
                        <span className="font-semibold text-white">수입</span>
                    </div>
                    <div className="pl-6 text-gray-300">
                        {income.toLocaleString('ko-KR')}원 ({incomePercent.toFixed(1)}%)
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded" style={{ backgroundColor: expenseColor }}></span>
                        <span className="font-semibold text-white">지출</span>
                    </div>
                     <div className="pl-6 text-gray-300">
                        {expense.toLocaleString('ko-KR')}원 ({expensePercent.toFixed(1)}%)
                    </div>
                </div>
            </div>
        </div>
    );
};


// Chart for income/expense over a period
const PeriodChart: React.FC<{ expenses: Expense[] }> = ({ expenses }) => {
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    
    const [startDate, setStartDate] = useState(threeMonthsAgo);
    const [endDate, setEndDate] = useState(today);

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = new Date(e.target.value);
        if (newStartDate > endDate) {
            setEndDate(newStartDate);
        }
        setStartDate(newStartDate);
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndDate = new Date(e.target.value);
        if (newEndDate < startDate) {
            setStartDate(newEndDate);
        }
        setEndDate(newEndDate);
    };

    const chartData = useMemo(() => {
        const filteredExpenses = expenses.filter(e => {
            const [y, m, d] = e.date.split('-').map(Number);
            const expenseDate = new Date(y, m - 1, d); // Timezone-safe date
            const inclusiveEndDate = new Date(endDate);
            inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
            return expenseDate >= startDate && expenseDate < inclusiveEndDate;
        });

        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const aggregateByMonth = diffDays > 62;

        const aggregated = filteredExpenses.reduce((acc, expense) => {
            const expenseDate = new Date(expense.date);
            const key = aggregateByMonth
                ? expenseDate.toISOString().slice(0, 7) // 'YYYY-MM'
                : expense.date; // 'YYYY-MM-DD'

            if (!acc[key]) {
                acc[key] = { income: 0, expense: 0 };
            }

            if (expense.type === 'income') {
// FIX: Ensure expense.amount is treated as a number to prevent runtime errors.
                acc[key].income += Number(expense.amount || 0);
            } else {
// FIX: Ensure expense.amount is treated as a number to prevent runtime errors.
                acc[key].expense += Number(expense.amount || 0);
            }
            return acc;
        }, {} as Record<string, { income: number, expense: number }>);
        
        return Object.entries(aggregated)
            // Fix: Replace spread syntax with explicit property assignment to avoid potential type inference issues.
            // FIX: Explicitly type the destructured array from Object.entries to resolve TypeScript inference errors.
            .map(([label, values]: [string, { income: number; expense: number }]) => ({ label, income: values.income, expense: values.expense }))
            .sort((a, b) => a.label.localeCompare(b.label));
            
    }, [expenses, startDate, endDate]);

    const formatLabel = (label: string) => {
        const isMonth = label.length === 7; // 'YYYY-MM'
        if (isMonth) {
            const [_, month] = label.split('-');
            return `${parseInt(month, 10)}월`;
        } else { // 'YYYY-MM-DD'
            const [_, month, day] = label.split('-');
            return `${month}/${day}`;
        }
    };
    
    const maxValue = Math.max(...chartData.flatMap(d => [d.income, d.expense]), 1);

    return (
        <div className="flex flex-col h-full p-4">
            <div className="flex-shrink-0 flex items-center justify-center gap-2 mb-4">
                <input type="date" value={startDate.toISOString().split('T')[0]} onChange={handleStartDateChange} className="bg-gray-700 text-white p-2 rounded-md text-sm" />
                <span>~</span>
                <input type="date" value={endDate.toISOString().split('T')[0]} onChange={handleEndDateChange} className="bg-gray-700 text-white p-2 rounded-md text-sm" />
            </div>

            {chartData.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-gray-500">
                    해당 기간의 데이터가 없습니다.
                </div>
            ) : (
                <div className="flex-grow flex flex-col min-h-0">
                     <div className="flex-shrink-0 flex justify-center items-center gap-6 text-sm mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                            <span>수입</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-cyan-500"></div>
                            <span>지출</span>
                        </div>
                    </div>
                    <div className="flex-grow w-full overflow-x-auto pb-4">
                         <div className="flex justify-start items-end gap-4 h-full" style={{minWidth: `${chartData.length * 4}rem`}}>
                            {chartData.map(d => (
                                <div key={d.label} className="flex-grow flex flex-col items-center justify-end h-full relative group">
                                    <div className="absolute -top-6 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap">
                                        수입: {d.income.toLocaleString()}원<br/>지출: {d.expense.toLocaleString()}원
                                    </div>
                                    <div className="flex items-end gap-1 w-full h-full justify-center">
                                        <div 
                                            className="w-1/2 bg-green-500 rounded-t-sm transition-all duration-300" 
                                            style={{ height: `${(d.income / maxValue) * 100}%` }}
                                            title={`수입: ${d.income.toLocaleString('ko-KR')}원`}
                                        ></div>
                                        <div 
                                            className="w-1/2 bg-cyan-500 rounded-t-sm transition-all duration-300" 
                                            style={{ height: `${(d.expense / maxValue) * 100}%` }}
                                            title={`지출: ${d.expense.toLocaleString('ko-KR')}원`}
                                        ></div>
                                    </div>
                                    <span className="text-xs mt-2 text-gray-400 whitespace-nowrap">{formatLabel(d.label)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export const ExpensesStatsView: React.FC<{ expenses: Expense[] }> = ({ expenses }) => {
    type Tab = 'category' | 'income_expense' | 'period';
    const [activeTab, setActiveTab] = useState<Tab>('category');

    // State for Category Chart date range
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [categoryStartDate, setCategoryStartDate] = useState(startOfMonth);
    const [categoryEndDate, setCategoryEndDate] = useState(today);

    // State for Pie Chart month
    const [pieChartMonth, setPieChartMonth] = useState(new Date());

    const handleCategoryStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = new Date(e.target.value);
        if (newStartDate > categoryEndDate) {
            setCategoryEndDate(newStartDate);
        }
        setCategoryStartDate(newStartDate);
    };

    const handleCategoryEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndDate = new Date(e.target.value);
        if (newEndDate < categoryStartDate) {
            setCategoryStartDate(newEndDate);
        }
        setCategoryEndDate(newEndDate);
    };

    const categoryData = useMemo(() => {
        const expenseByCategory = expenses
            .filter(e => {
                if (e.type !== 'expense') return false;
                // FIX: Add robust date parsing and validation to prevent operations on undefined or NaN.
                const dateParts = e.date.split('-').map(s => parseInt(s, 10));
                if (dateParts.length < 3 || dateParts.some(isNaN)) {
                    return false;
                }
                const [y, m, d] = dateParts;
                const expenseDate = new Date(y, m - 1, d); // Timezone-safe date
                const inclusiveEndDate = new Date(categoryEndDate);
                inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
                
                return expenseDate >= categoryStartDate && expenseDate < inclusiveEndDate;
            })
            .reduce((acc, expense) => {
                const category = expense.category || '기타';
// FIX: Ensure expense.amount is treated as a number to prevent runtime errors.
                acc[category] = (acc[category] || 0) + Number(expense.amount || 0);
                return acc;
            }, {} as Record<string, number>);

        const colors = ['#38bdf8', '#818cf8', '#f472b6', '#fbbf24', '#a3e635', '#4ade80', '#fb923c', '#94a3b8'];
        
        return Object.entries(expenseByCategory)
            // FIX: Explicitly type sort arguments to ensure they are treated as numbers, as type inference was failing.
            .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
            .map(([name, value], index) => ({
                name,
                value,
                color: colors[index % colors.length]
            }));
    }, [expenses, categoryStartDate, categoryEndDate]);

    const { totalIncome, totalExpense } = useMemo(() => {
        const filtered = expenses.filter(e => {
            // FIX: Add robust date parsing and validation to prevent operations on undefined or NaN.
            if (!e.date) return false;
            const datePartsStr = e.date.split('-');
            if (datePartsStr.length < 2) return false;

            const year = parseInt(datePartsStr[0], 10);
            const month = parseInt(datePartsStr[1], 10);

            if (isNaN(year) || isNaN(month)) {
                return false;
            }
            
            return year === pieChartMonth.getFullYear() &&
                   (month - 1) === pieChartMonth.getMonth();
        });
        const income = filtered
            .filter(e => e.type === 'income')
// FIX: Ensure e.amount is treated as a number to prevent runtime errors. This was the source of the error.
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const expense = filtered
            .filter(e => e.type === 'expense')
// FIX: Ensure e.amount is treated as a number to prevent runtime errors. This was the source of the error.
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        return { totalIncome: income, totalExpense: expense };
    }, [expenses, pieChartMonth]);
    
    const renderChart = () => {
        switch (activeTab) {
            case 'category':
                return (
                    <div className="flex flex-col h-full">
                        <div className="flex-shrink-0 flex items-center justify-center gap-2 p-4 border-b border-gray-700/50">
                            <input type="date" value={categoryStartDate.toISOString().split('T')[0]} onChange={handleCategoryStartDateChange} className="bg-gray-700 text-white p-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                            <span>~</span>
                            <input type="date" value={categoryEndDate.toISOString().split('T')[0]} onChange={handleCategoryEndDateChange} className="bg-gray-700 text-white p-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </div>
                        <div className="flex-grow min-h-0">
                           <CategoryChart data={categoryData} />
                        </div>
                    </div>
                );
            case 'income_expense':
                return (
                    <div className="flex flex-col h-full">
                        <div className="flex-shrink-0 flex items-center justify-center p-2 border-b border-gray-700/50">
                            <MonthYearPicker
                                selectedDate={pieChartMonth}
                                onChange={setPieChartMonth}
                            />
                        </div>
                        <div className="flex-grow min-h-0">
                           <IncomeExpensePieChart income={totalIncome} expense={totalExpense} />
                        </div>
                    </div>
                );
            case 'period':
                return <PeriodChart expenses={expenses} />;
            default:
                return null;
        }
    };
    
    const TabButton = ({ id, label }: { id: Tab, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border rounded-md ${
                activeTab === id 
                ? 'bg-cyan-600 text-white border-cyan-500' 
                : 'text-cyan-400 hover:bg-cyan-600/20 border-transparent'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
                <TabButton id="category" label="용도별" />
                <TabButton id="income_expense" label="수입/지출 그래프" />
                <TabButton id="period" label="기간별 수입/지출 그래프" />
            </div>
            <div className="flex-grow bg-gray-800/30 rounded-lg min-h-0">
                {renderChart()}
            </div>
        </div>
    );
};