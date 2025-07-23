import { motion } from "framer-motion";

interface CheckboxGroupProps<T extends { id: string; name: string }> {
  items: T[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  label: string;
  emptyMessage: string;
}

export const CheckboxGroup = <T extends { id: string; name: string }>({
  items,
  selectedIds,
  setSelectedIds,
  label,
  emptyMessage,
}: CheckboxGroupProps<T>) => {
  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-3">
        {label}
      </label>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <motion.label
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                htmlFor={`checkbox-${item.id}`}
                className={`cursor-pointer px-2.5 py-1.5 rounded-md text-sm font-medium border transition
                  ${
                    selected
                      ? "bg-[#fc089e] hover:bg-[#ff66c4] text-white"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-red-50"
                  }`}
              >
                <div className="flex items-center gap-2 justify-center">
                  <input
                    type="checkbox"
                    id={`checkbox-${item.id}`}
                    checked={selected}
                    onChange={() => handleToggle(item.id)}
                    className="hidden"
                  />
                  <span className="truncate">{item.name}</span>
                </div>
              </motion.label>
            );
          })}
        </div>
      )}
    </div>
  );
};
