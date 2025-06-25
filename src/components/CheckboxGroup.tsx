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
      <label className="block text-sm font-semibold text-gray-800 mb-3">
        {label}
      </label>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => {
            const isChecked = selectedIds.includes(item.id);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center group"
              >
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id={`checkbox-${item.id}`}
                    checked={isChecked}
                    onChange={() => handleToggle(item.id)}
                    className="peer appearance-none h-5 w-5 border-2 border-gray-300 rounded-md cursor-pointer checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
                    aria-label={item.name}
                  />
                  <motion.span
                    className="absolute left-1 top-1 w-3 h-3 bg-blue-600 rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                    animate={{ scale: isChecked ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <label
                  htmlFor={`checkbox-${item.id}`}
                  className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 cursor-pointer truncate transition-colors duration-200"
                >
                  {item.name}
                </label>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
