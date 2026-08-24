export default function SearchInput({ searchTerm, setSearchTerm, placeholder = "Search..." }) {
  return (
    <span className="term-field">
      <input
        type="text"
        className="input"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <span className="cursor-block" aria-hidden="true">▮</span>
    </span>
  );
}
