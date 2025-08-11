export default function TailwindTest() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-semibold">Tailwind CSS Test Page</h1>
            <p className="mb-4">This is a simple test page to demonstrate Tailwind CSS styles.</p>
            <button className="btn-primary mb-2">Primary Button</button>
            <button className="btn-secondary">Secondary Button</button>
            <div className="mt-6">  
                <h2 className="text-xl font-semibold mb-2">Tailwind CSS Features</h2>
                <ul className="list-disc pl-5">
                    <li className="mb-1">Responsive design</li>
                    <li className="mb-1">Utility-first CSS</li>
                    <li className="mb-1">Customizable themes</li>
                    <li className="mb-1">Built-in dark mode support</li>
                    <li className="mb-1">Extensive component library</li>
                </ul>
            </div>
            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Example Form</h2>
                <form className="bg-white p-4 rounded shadow-sm">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            className="textbox"
                            placeholder="Enter your name"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
