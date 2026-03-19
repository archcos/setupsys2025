export default function IndustrySelect({ value, onChange, className = '', includeAll = true }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={className}
    >
      {includeAll && <option value="">All Industries</option>}
      <optgroup label="SETUP 4.0 Priority Sectors">
        <option value="Crop and animal production, hunting, and related service activities">Crop & Animal Production</option>
        <option value="Forestry and Logging">Forestry & Logging</option>
        <option value="Fishing and aquaculture">Fishing & Aquaculture</option>
        <option value="Food processing">Food Processing</option>
        <option value="Beverage manufacturing">Beverage Manufacturing</option>
        <option value="Textile manufacturing">Textile Manufacturing</option>
        <option value="Wearing apparel manufacturing">Wearing Apparel</option>
        <option value="Leather and related products manufacturing">Leather Products</option>
        <option value="Wood and products of wood and cork manufacturing">Wood & Cork Products</option>
        <option value="Paper and paper products manufacturing">Paper & Paper Products</option>
        <option value="Chemicals and chemical products manufacturing">Chemicals & Chemical Products</option>
        <option value="Basic pharmaceutical products and pharmaceutical preparations manufacturing">Pharmaceutical Products</option>
        <option value="Rubber and plastic products manufacturing">Rubber & Plastic Products</option>
        <option value="Non-metallic mineral products manufacturing">Non-metallic Minerals</option>
        <option value="Fabricated metal products manufacturing">Fabricated Metal Products</option>
        <option value="Machinery and equipment, Not Elsewhere Classified (NEC) manufacturing">Machinery & Equipment (NEC)</option>
        <option value="Other transport equipment manufacturing">Transport Equipment</option>
        <option value="Furniture manufacturing">Furniture Manufacturing</option>
        <option value="Information and Communication">Information & Communication</option>
        <option value="Other regional priority industries approved by the Regional Development Council">Regional Priority Industries</option>
      </optgroup>
      <optgroup label="SETUP Former Priority Sectors">
        <option value="Agriculture/Aquaculture/Forestry">Agriculture / Aquaculture / Forestry</option>
        <option value="Creative Industry">Creative Industry</option>
        <option value="Energy and Environment">Energy and Environment</option>
        <option value="Furniture">Furniture</option>
        <option value="Gifts, Decors, Handicrafts">Gifts, Decors, Handicrafts</option>
        <option value="Health and Wellness">Health and Wellness</option>
        <option value="Metals and Engineering">Metals and Engineering</option>
        <option value="Other Regional Priority Sectors">Other Regional Priority Sectors</option>
      </optgroup>
    </select>
  );
}