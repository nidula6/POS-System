import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { UserCircleIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PasswordConfirmModal from './PasswordConfirmModal';
import toast from 'react-hot-toast';

export default function RoleSwitcher() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Demo accounts for quick switching
  const demoAccounts = [
    { username: 'admin', password: 'admin123', role: 'Admin', icon: '👨‍💼' },
    { username: 'cashier', password: 'cashier123', role: 'Cashier', icon: '👨‍💻' }
  ];

  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const handleConfirmSwitch = async (username, password) => {
    if (password !== selectedAccount.password) {
      throw new Error('Invalid password');
    }

    try {
      await login(username, password);
      toast.success(`Switched to ${selectedAccount.role} role`);
      
      // Navigate based on role
      if (username === 'admin') {
        navigate('/admin');
      } else {
        navigate('/cashier');
      }
    } catch (error) {
      toast.error('Error switching role');
      throw error;
    }
  };

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600">
            <ArrowsRightLeftIcon className="h-5 w-5" />
            Switch Role
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <div className="px-4 py-2 text-xs text-gray-500 border-b">
                Current: {user?.role === 'admin' ? '👨‍💼 Admin' : '👨‍💻 Cashier'}
              </div>
              {demoAccounts
                .filter(account => account.username !== user?.username)
                .map((account) => (
                  <Menu.Item key={account.username}>
                    {({ active }) => (
                      <button
                        onClick={() => handleSelectAccount(account)}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } group flex w-full items-center px-4 py-2 text-sm`}
                      >
                        <span className="mr-3 text-lg">{account.icon}</span>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{account.role}</span>
                          <span className="text-xs text-gray-500">@{account.username}</span>
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      <PasswordConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSwitch}
        username={selectedAccount?.username}
      />
    </>
  );
}
