import React from 'react'
import { Link } from 'react-router-dom';
import { MenuItems }  from './MenuItems';
import './Dropdown.css';

export default function Dropdown() {
    const [click, setClick] = React.useState(false);
    const handleClick = () => {
        setClick(!click);
    };

    return (
        <ul className={click ? 'dropdown-menu clicked' : 'dropdown-menu'} onClick={handleClick}>
            {MenuItems.map((item, index) => {
                return (
                    <li key={index}>
                        <Link className={item.cName} to={item.path} onClick={() => setClick(false)}>
                            {item.title}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}