import React from 'react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: () => void;
    placeholder?: string;
    className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChange,
    onSearch,
    placeholder = 'Search...',
    className = '',
}) => {
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    return (
        <div className={`flex-1 relative ${className}`}>
            
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                fill="none" viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor">
                <path strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                className="w-full pl-12 pr-4 py-input-y bg-[#1a2942] border border-gray-700 rounded-component text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
        </div>
    );
};

export default SearchBar;