import React from 'react';

export default function SearchInput({ searchTerm, setSearchTerm, placeholder = "Search..." }) {
  return (
    <input
      type="text"
      className="input"
      placeholder={placeholder}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  );
}
