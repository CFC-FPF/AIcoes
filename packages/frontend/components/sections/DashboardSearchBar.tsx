import React from 'react';
import SearchBar from '../ui/SearchBar';
import Button from '../ui/Button';
import { FaMagnifyingGlass } from 'react-icons/fa6';

interface DashboardSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

/**
 * DashboardSearchBar - Composite search bar for Dashboard
 * Combines SearchBar and search Button with icon
 * Encapsulates the layout and styling specific to Dashboard search
 */
const DashboardSearchBar: React.FC<DashboardSearchBarProps> = ({
  value,
  onChange,
  onSearch,
}) => {
  return (
    <div className="flex gap-1 w-full max-w-2xl">
      <SearchBar
        value={value}
        onChange={onChange}
        onSearch={onSearch}
        placeholder="Search for a company (e.g., Apple, Tesla...)"
      />
      <Button onClick={onSearch}>
        <FaMagnifyingGlass size={24} color="white" />
      </Button>
    </div>
  );
};

export default DashboardSearchBar;
