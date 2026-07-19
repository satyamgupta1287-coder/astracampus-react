const fs = require('fs');
let content = fs.readFileSync('src/pages/ManageFees.jsx', 'utf8');

const target = `                            ))}
                        </div>
                    </div>
                </div>
            </div>`;

const replacer = `                            ))}
                        </div>
                        </div>
                    </div>
                </div>
            </div>`;

content = content.replace(target, replacer);
fs.writeFileSync('src/pages/ManageFees.jsx', content);
